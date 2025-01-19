import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { plugin } from './index';
import type { ExtendedXFiPlugin } from './index';

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

describe('regexExtractOperator', () => {
  const operator = plugin.operators[0];

  it('should return false for invalid input', () => {
    expect(operator.fn(null, '.*')).toBe(false);
    expect(operator.fn({}, '.*')).toBe(false);
    expect(operator.fn({ result: null }, '.*')).toBe(false);
  });

  it('should return true for non-empty result array', () => {
    expect(operator.fn({ result: ['match'] }, '.*')).toBe(true);
  });

  it('should return false for empty result array', () => {
    expect(operator.fn({ result: [] }, '.*')).toBe(false);
  });
});

describe('externalCallFact', () => {
  const fact = plugin.facts[0];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle missing file data', async () => {
    const almanac = {
      factValue: jest.fn().mockResolvedValue(null)
    };

    const result = await fact.fn({}, almanac);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No file data available');
    expect(result.timestamp).toBeDefined();
  });

  it('should handle successful API call with extracted value', async () => {
    const mockResponse = { data: { status: 'success' } };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const almanac = {
      factValue: jest.fn().mockResolvedValue({
        fileContent: 'test value: 123'
      })
    };

    const params = {
      regex: 'value: (\\d+)',
      url: 'http://api.example.com',
      includeValue: true,
      headers: { 'Content-Type': 'application/json' }
    };

    const result = await fact.fn(params, almanac);
    
    expect(result.success).toBe(true);
    expect(result.extractedValue).toBe('123');
    expect(result.apiResponse).toEqual(mockResponse.data);
    expect(result.timestamp).toBeDefined();
    
    expect(axios.post).toHaveBeenCalledWith(
      params.url,
      { value: '123' },
      expect.objectContaining({
        headers: params.headers,
        timeout: 5000
      })
    );
  });

  it('should handle regex match failure', async () => {
    const almanac = {
      factValue: jest.fn().mockResolvedValue({
        fileContent: 'no match here'
      })
    };

    const params = {
      regex: 'value: (\\d+)',
      url: 'http://api.example.com'
    };

    const result = await fact.fn(params, almanac);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('No match found');
  });

  it('should handle API call failure', async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    const almanac = {
      factValue: jest.fn().mockResolvedValue({
        fileContent: 'test value: 123'
      })
    };

    const params = {
      regex: 'value: (\\d+)',
      url: 'http://api.example.com'
    };

    const result = await fact.fn(params, almanac);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
    expect(result.timestamp).toBeDefined();
  });
});

describe('loadRulesFromDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load valid rule files', () => {
    const mockFiles = ['test-rule.json', 'other-rule.json', 'not-a-rule.txt'];
    const mockRuleContent = '{"name": "test rule"}';
    
    (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockRuleContent);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    const rules = plugin.sampleRules;
    
    expect(rules).toHaveLength(2); // Only .json files
    expect(rules[0]).toEqual({ name: 'test rule' });
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
  });

  it('should handle invalid JSON in rule files', () => {
    const mockFiles = ['invalid-rule.json'];
    const mockRuleContent = 'invalid json';
    
    (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockRuleContent);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const rules = plugin.sampleRules;
    
    expect(rules).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe('plugin configuration', () => {
  it('should export correct plugin structure', () => {
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
