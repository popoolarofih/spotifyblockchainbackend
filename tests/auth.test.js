const request = require('supertest');
const app = require('../src/index');
const axios = require('axios');

// Mock the dependencies
jest.mock('axios');
jest.mock('../src/services/supabase');
const supabase = require('../src/services/supabase');

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /auth/login', () => {
    it('should redirect to the Twitch authorization URL', async () => {
      const response = await request(app).get('/auth/login');
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://id.twitch.tv/oauth2/authorize');
    });

    it('should set a referral code cookie if provided', async () => {
      const response = await request(app).get('/auth/login?ref=testcode');
      expect(response.headers['set-cookie'][0]).toContain('referral_code=testcode');
    });
  });

  describe('GET /auth/callback', () => {
    it('should handle state mismatch error', async () => {
      const response = await request(app)
        .get('/auth/callback?code=somecode&state=somestate')
        .set('Cookie', 'twitch_auth_state=differentstate');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=state_mismatch');
    });

    it('should successfully create a new user and redirect with a token', async () => {
      // Arrange
      const state = 'teststate';
      const code = 'testcode';
      axios.post.mockResolvedValue({
        data: { access_token: 'test_access_token' },
      });
      axios.get.mockResolvedValue({
        data: { data: [{ id: '123', display_name: 'testuser', email: 'test@test.com' }] },
      });
      // Mock Supabase to find no existing user
      supabase.from.mockImplementation((tableName) => {
        const fromChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }), // No user found
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis()
        };
        // Mock the insert call specifically
        fromChain.insert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1, twitch_id: '123' }, error: null })
        });
        return fromChain;
      });

      // Act
      const response = await request(app)
        .get(`/auth/callback?code=${code}&state=${state}`)
        .set('Cookie', `twitch_auth_state=${state}`);

      // Assert
      expect(axios.post).toHaveBeenCalledWith('https://id.twitch.tv/oauth2/token', expect.any(String));
      expect(axios.get).toHaveBeenCalledWith('https://api.twitch.tv/helix/users', expect.any(Object));
      expect(supabase.insert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
            twitch_id: '123',
            points: 1500
        })
      ]));
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('token=');
    });

    it('should log in an existing user and redirect with a token', async () => {
        // Arrange
        const state = 'teststate';
        const code = 'testcode';
        axios.post.mockResolvedValue({
          data: { access_token: 'test_access_token' },
        });
        axios.get.mockResolvedValue({
          data: { data: [{ id: '456', display_name: 'existinguser', email: 'exist@test.com' }] },
        });
        // Mock Supabase to find an existing user
        const existingUser = { id: 2, twitch_id: '456', username: 'oldname' };
        supabase.from.mockImplementation((tableName) => {
            const fromChain = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: existingUser, error: null }),
              update: jest.fn().mockReturnThis()
            };
            // Mock the update call specifically
            fromChain.update = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { ...existingUser, username: 'existinguser' }, error: null })
            });
            return fromChain;
        });

        // Act
        const response = await request(app)
            .get(`/auth/callback?code=${code}&state=${state}`)
            .set('Cookie', `twitch_auth_state=${state}`);

        // Assert
        expect(supabase.update).toHaveBeenCalledWith({ username: 'existinguser', email: 'exist@test.com' });
        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('token=');
    });
  });
});
