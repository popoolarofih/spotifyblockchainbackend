const request = require('supertest');
const app = require('../src/index');

// Mock the dependencies used by the controllers
jest.mock('../src/services/supabase');
jest.mock('../src/services/ethers');
const supabase = require('../src/services/supabase');
const provider = require('../src/services/ethers');

describe('GET /health', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return 200 OK when all services are healthy', async () => {
    // Arrange: Mocks are healthy by default in the __mocks__ folder
    // We can still override them here if needed for a specific test

    // Act
    const response = await request(app).get('/health');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.dependencies.supabase).toBe('OK');
    expect(response.body.dependencies.baseNetwork).toBe('OK');
  });

  it('should return 503 Service Unavailable if Supabase fails', async () => {
    // Arrange
    // We need to mock the implementation for this specific test case
    supabase.from.mockImplementation(() => {
        const newSupabase = {...supabase};
        newSupabase.select = jest.fn().mockReturnThis();
        newSupabase.limit = jest.fn().mockReturnValueOnce(Promise.resolve({ error: { message: 'Supabase connection failed' } }));
        return newSupabase;
    });

    // Act
    const response = await request(app).get('/health');

    // Assert
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('ERROR');
    expect(response.body.dependencies.supabase).toContain('Supabase error: Supabase connection failed');
    expect(response.body.dependencies.baseNetwork).toBe('OK');
  });

  it('should return 503 Service Unavailable if the Base network provider fails', async () => {
    // Arrange
    provider.getBlockNumber.mockRejectedValueOnce(new Error('Base network provider failed'));

    // Act
    const response = await request(app).get('/health');

    // Assert
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('ERROR');
    expect(response.body.dependencies.supabase).toBe('OK');
    expect(response.body.dependencies.baseNetwork).toContain('Base network provider failed');
  });
});
