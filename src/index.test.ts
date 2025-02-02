import axios from 'axios';
import plugin from './index';
import type { XFiPlugin, OperatorDefn, FactDefn } from 'x-fidelity';

// Mock x-fidelity
jest.mock('x-fidelity', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  return {
    logger: mockLogger
  };
});

// Import after mocking
import { logger } from 'x-fidelity';

// Cast to a more specific type for testing
const typedPlugin = plugin as XFiPlugin as {
  name: string;
  version: string;
  operators: OperatorDefn[];
  facts: FactDefn[];
};

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

// Add common test utilities
const createMockAlmanac = (fileContent: string | null) => ({
  factValue: jest.fn().mockResolvedValue(
    fileContent === null ? null : { fileContent }
  )
});

describe('Plugin: xfi-example-plugin', () => {
  describe('regexExtract Operator', () => {
    const { fn: regexExtract } = typedPlugin.operators[0];

    it.each([
      [null, '.*', false, 'null input'],
      [{}, '.*', false, 'empty object'],
      [{ result: null }, '.*', false, 'null result'],
      [{ result: [] }, '.*', false, 'empty result array'],
      [{ result: ['match'] }, '.*', true, 'valid match'],
    ])('should handle %s case', (input, pattern, expected, _desc) => {
      expect(regexExtract(input, pattern)).toBe(expected);
    });
  });

  describe('externalApiCall Fact', () => {
    const { fn: externalApiCall } = typedPlugin.facts[0];
    
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
          message: 'Network error',
          isPluginError: true,
          level: 'error',
          details: expect.objectContaining({
            operation: 'externalApiCall',
            timestamp: expect.any(String)
          })
        });
      });
    });
  });

  describe('Plugin Configuration', () => {
    it('should have correct structure', () => {
      expect(plugin).toMatchObject({
        name: 'xfi-example-plugin',
        version: '1.0.0',
        operators: expect.any(Array),
        facts: expect.any(Array),
        onError: expect.any(Function)
      });
      
      expect(plugin.operators).toHaveLength(1);
      expect(plugin.facts).toHaveLength(1);
    });

    it('should handle plugin errors correctly', () => {
      const pluginError = new Error('Test error');
      (pluginError as any).isPluginError = true;
      (pluginError as any).level = 'warning';
      (pluginError as any).details = { test: true };

      if (plugin.onError) {
        const result = plugin.onError(pluginError);
        expect(result).toEqual({
          level: 'warning',
          message: 'Test error',
          details: { test: true }
        });
      }
    });

    it('should handle non-plugin errors as fatal', () => {
      const error = new Error('Regular error');
      let result;
      if (plugin.onError) {
        result = plugin.onError(error);
        expect(result).toEqual({
          level: 'fatality',
          message: 'Regular error',
          details: error.stack
        });
      }
    });
  });
});
