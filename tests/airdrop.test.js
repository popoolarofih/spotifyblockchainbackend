const request = require('supertest');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

// Mock the dependencies
jest.mock('../src/services/supabase');
jest.mock('../src/services/ethers');
const supabase = require('../src/services/supabase');
const provider = require('../src/services/ethers');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-key-that-should-be-in-env';

describe('POST /airdrop/claim', () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a valid token for a mock user
    const mockUser = { id: 1, twitch_id: '12345' };
    token = jwt.sign(mockUser, JWT_SECRET);
  });

  it('should return 401 Unauthorized if no token is provided', async () => {
    const response = await request(app)
      .post('/airdrop/claim')
      .send({ transactionHash: '0x123' });

    expect(response.status).toBe(401);
  });

  it('should return 400 Bad Request if transactionHash is missing', async () => {
    const response = await request(app)
      .post('/airdrop/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Transaction hash is required.');
  });

  it('should return 400 Bad Request if user has claimed within the last 3 days', async () => {
    // Arrange
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { last_claimed_at: twoDaysAgo.toISOString() },
          error: null,
        }),
      }),
    });

    // Act
    const response = await request(app)
      .post('/airdrop/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionHash: '0x123' });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('You have already claimed.');
  });

  it('should return 404 Not Found if transaction is not found', async () => {
    // Arrange
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { last_claimed_at: null }, error: null }),
      }),
    });
    provider.getTransaction.mockResolvedValue(null);

    // Act
    const response = await request(app)
      .post('/airdrop/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionHash: '0xnonexistent' });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Transaction not found.');
  });

  it('should successfully claim airdrop with a valid transaction', async () => {
    // Arrange
    process.env.PAYMENT_WALLET_ADDRESS = '0xd108c3EFda7617648E73f02f56ed348049BdB9A9';
    process.env.FIXED_ETH_AMOUNT = '0.0003';

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { last_claimed_at: null }, error: null }),
    });

    provider.getTransaction.mockResolvedValue({
      to: '0xd108c3EFda7617648E73f02f56ed348049BdB9A9',
      value: ethers.parseEther('0.0003'),
      wait: jest.fn().mockResolvedValue({ status: 1 }),
    });

    // Act
    const response = await request(app)
      .post('/airdrop/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionHash: '0xvalid' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('Airdrop claimed successfully');
    expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({
        last_claimed_at: expect.any(String)
    }));
  });
});
