const supabase = require('../services/supabase');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');

// It's highly recommended to move these to your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-key-that-should-be-in-env';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/auth/callback`;


const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const login = (req, res) => {
  const state = generateRandomString(16);
  res.cookie('spotify_auth_state', state);

  const refCode = req.query.ref || null;
  if (refCode) {
    res.cookie('referral_code', refCode, { maxAge: 900000, httpOnly: true });
  }

  const scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state
    }));
};

const callback = async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies['spotify_auth_state'] : null;
  const referralCode = req.cookies ? req.cookies['referral_code'] : null;

  if (state === null || state !== storedState) {
    return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
  }

  res.clearCookie('spotify_auth_state');
  if (referralCode) {
    res.clearCookie('referral_code');
  }

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }),
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  try {
    const response = await axios.post(authOptions.url, authOptions.data, { headers: authOptions.headers });
    const { access_token, refresh_token } = response.data;

    const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const profile = profileResponse.data;

    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('spotify_id', profile.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
      console.error('Error fetching user:', error);
      throw error;
    }

    if (!user) {
      // New user
      const referral_code = generateRandomString(8);
      let points = 1000;
      if (profile.product === 'premium') {
        points += 500;
      }

      let referred_by_id = null;
      if (referralCode) {
        const { data: referrer, error: referrerError } = await supabase
          .from('users')
          .select('id, points')
          .eq('referral_code', referralCode)
          .single();

        if (referrer) {
          referred_by_id = referrer.id;
          // Award points to the referrer
          await supabase
            .from('users')
            .update({ points: referrer.points + 5 })
            .eq('id', referrer.id);
        }
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          spotify_id: profile.id,
          email: profile.email,
          username: profile.display_name,
          premium_status: profile.product === 'premium',
          points: points,
          referral_code: referral_code,
          referred_by: referred_by_id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting user:', insertError);
        throw insertError;
      }
      user = newUser;
    } else {
      // Existing user, update premium status and username
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
            premium_status: profile.product === 'premium',
            username: profile.display_name,
            email: profile.email
        })
        .eq('spotify_id', profile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
      user = updatedUser;
    }

    const token = jwt.sign({ id: user.id, spotify_id: user.spotify_id }, JWT_SECRET, { expiresIn: '1h' });

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}?token=${token}`);

  } catch (error) {
    console.error('Authentication error:', error.response ? error.response.data : error.message);
    res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
  }
};

const profile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('username, email, points, referral_code')
            .eq('id', req.user.id)
            .single();

        if (error) {
            throw error;
        }

        if (user) {
            const referral_link = `${FRONTEND_URL}/register?ref=${user.referral_code}`;
            res.json({ ...user, referral_link });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
  login,
  callback,
  profile
};
