import axios from 'axios';
import { externalCallFact } from '../externalApiCall';

jest.mock('axios');

// Add common test utilities
const createMockAlmanac = (fileContent: string | null) => ({
  factValue: jest.fn().mockResolvedValue(
    fileContent === null ? null : { fileContent }
  )
});

describe('externalApiCall Fact', () => {
  const { fn: externalApiCall } = externalCallFact;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should handle missing file data', async () => {
      const almanac = createMockAlmanac(null);
      const result = await externalApiCall({}, almanac);
      
      expect(result).toEqual({
        success: false,
        error: 'No file data available',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Regex Extraction', () => {
    it('should handle regex match failure', async () => {
      const almanac = createMockAlmanac('no match here');
      const params = {
        regex: 'value: (\\d+)',
        url: 'http://api.example.com'
      };

      const result = await externalApiCall(params, almanac);
      
      expect(result).toEqual({
        success: false,
        reason: 'No match found'
      });
    });
  });

  describe('API Integration', () => {
    const validParams = {
      regex: 'value: (\\d+)',
      url: 'http://api.example.com',
      includeValue: true,
      headers: { 'Content-Type': 'application/json' }
    };

    it('should handle successful API call', async () => {
      const mockResponse = { data: { status: 'success' } };
      (axios.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const almanac = createMockAlmanac('test value: 123');
      const result = await externalApiCall(validParams, almanac);

      expect(result).toEqual({
        success: true,
        extractedValue: '123',
        apiResponse: mockResponse.data,
        timestamp: expect.any(String)
      });

      expect(axios.post).toHaveBeenCalledWith(
        validParams.url,
        { value: '123' },
        expect.objectContaining({
          headers: validParams.headers,
          timeout: 5000
        })
      );
    });

    it('should handle API call failure', async () => {
      const networkError = new Error('Network error');
      (axios.post as jest.Mock).mockRejectedValue(networkError);
      
      const almanac = createMockAlmanac('test value: 123');
      
      await expect(externalApiCall(validParams, almanac)).rejects.toMatchObject({
        message: 'API call failed',
        level: 'error',
        details: expect.objectContaining({ 
          operation: 'externalApiCall',
          stack: expect.any(String)
        })
      });
    });
  });
});
