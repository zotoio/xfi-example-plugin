import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import plugin from './index';
import type { XFiPlugin, OperatorDefn, FactDefn } from 'x-fidelity';

// Cast to a more specific type for testing
const typedPlugin = plugin as unknown as {
  name: string;
  version: string;
  operators: OperatorDefn[];
  facts: FactDefn[];
  sampleRules: any[];
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
        const result = await externalApiCall(validParams, almanac);

        expect(result).toEqual({
          success: false,
          error: 'Network error',
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Rule Loading', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('loadRulesFromDirectory', () => {
      it('should load valid rule files', () => {
        const mockFiles = ['test-rule.json', 'other-rule.json', 'not-a-rule.txt'];
        const mockRuleContent = '{"name": "test rule"}';
        
        (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
        (fs.readFileSync as jest.Mock).mockReturnValue(mockRuleContent);
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

        expect(typedPlugin.sampleRules).toHaveLength(2);
        expect(typedPlugin.sampleRules[0]).toEqual({ name: 'test rule' });
        expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      });

      it('should handle invalid JSON', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        (fs.readdirSync as jest.Mock).mockReturnValue(['invalid-rule.json']);
        (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
        
        expect(typedPlugin.sampleRules).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
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
        sampleRules: expect.any(Array)
      });
      
      expect(plugin.operators).toHaveLength(1);
      expect(plugin.facts).toHaveLength(1);
    });
  });
});
