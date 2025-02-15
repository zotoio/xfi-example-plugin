import axios from 'axios';
import { responseTimeFact } from './responseTime';

jest.mock('axios');

describe('responseTime Fact', () => {
  const { fn: responseTime } = responseTimeFact;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Response Time', () => {
    const validParams = {
      url: 'http://api.example.com',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    };

    it('should measure successful response time', async () => {
      const mockResponse = { status: 200, data: {} };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await responseTime(validParams, {});

      expect(result).toEqual({
        success: true,
        responseTime: expect.any(Number),
        status: 200,
        timestamp: expect.any(String)
      });

      expect(axios.get).toHaveBeenCalledWith(
        validParams.url,
        expect.objectContaining({
          timeout: validParams.timeout,
          headers: validParams.headers
        })
      );
    });

    it('should handle API call failure', async () => {
      const networkError = new Error('Network error');
      (axios.get as jest.Mock).mockRejectedValue(networkError);
      
      await expect(responseTime(validParams, {})).rejects.toMatchObject({
        message: 'Response time check failed',
        level: 'error',
        details: expect.objectContaining({
          operation: 'responseTime',
          stack: expect.any(String)
        })
      });
    });
  });
});
