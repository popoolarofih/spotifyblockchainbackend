const supabase = require('../services/supabase');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-key-that-should-be-in-env';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:3000/auth/callback`;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

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
  res.cookie('twitch_auth_state', state);

  const refCode = req.query.ref || null;
  if (refCode) {
    res.cookie('referral_code', refCode, { maxAge: 900000, httpOnly: true });
  }

  const scope = 'user:read:email';
  res.redirect('https://id.twitch.tv/oauth2/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: TWITCH_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: scope,
      state: state,
    }));
};

const callback = async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies ? req.cookies['twitch_auth_state'] : null;
  const referralCode = req.cookies ? req.cookies['referral_code'] : null;

  if (state === null || state !== storedState) {
    return res.redirect(FRONTEND_URL + '/#' + querystring.stringify({ error: 'state_mismatch' }));
  }

  res.clearCookie('twitch_auth_state');
  if (referralCode) {
    res.clearCookie('referral_code');
  }

  try {
    // 1. Exchange authorization code for an access token
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', querystring.stringify({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }));

    const accessToken = tokenResponse.data.access_token;

    // 2. Use the access token to get user information
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });

    const profile = userResponse.data.data[0];

    // 3. Check if user exists in our database
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('twitch_id', profile.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
      throw error;
    }

    // 4. Create or update user
    if (!user) {
      // New user
      const newReferralCode = generateRandomString(8);
      const points = 1500; // New point allocation for Twitch users

      let referred_by_id = null;
      if (referralCode) {
        const { data: referrer } = await supabase.from('users').select('id, points').eq('referral_code', referralCode).single();
        if (referrer) {
          referred_by_id = referrer.id;
          await supabase.from('users').update({ points: referrer.points + 5 }).eq('id', referrer.id);
        }
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          twitch_id: profile.id,
          email: profile.email,
          username: profile.display_name,
          points: points,
          referral_code: newReferralCode,
          referred_by: referred_by_id,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    } else {
      // Existing user, update their details if needed
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ username: profile.display_name, email: profile.email })
        .eq('twitch_id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    }

    // 5. Generate JWT and redirect to frontend
    const token = jwt.sign({ id: user.id, twitch_id: user.twitch_id }, JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`${FRONTEND_URL}?token=${token}`);

  } catch (error) {
    console.error('Authentication error:', error.response ? error.response.data : error.message);
    res.redirect(FRONTEND_URL + '/#' + querystring.stringify({ error: 'invalid_token' }));
  }
};

const profile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('username, email, points, referral_code')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

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
  profile,
};
