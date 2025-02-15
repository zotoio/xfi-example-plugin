import { sensitiveDataScanFact } from './sensitiveDataScan';

describe('sensitiveDataScan Fact', () => {
  const { fn: sensitiveDataScan } = sensitiveDataScanFact;

  const createMockAlmanac = (fileContent: string | null) => ({
    factValue: jest.fn().mockResolvedValue(
      fileContent === null ? null : { fileContent }
    )
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should handle missing file data', async () => {
      const almanac = createMockAlmanac(null);
      const result = await sensitiveDataScan({}, almanac);
      
      expect(result).toEqual({
        success: false,
        error: 'No file data available',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Pattern Matching', () => {
    it('should detect API keys', async () => {
      const fileContent = 'api_key="secret123"';
      const almanac = createMockAlmanac(fileContent);
      
      const result = await sensitiveDataScan({}, almanac);
      
      expect(result).toEqual({
        success: true,
        findings: [{
          type: 'apiKey',
          line: 1,
          match: 'api_key="secret123"'
        }],
        timestamp: expect.any(String)
      });
    });

    it('should detect passwords', async () => {
      const fileContent = 'password="unsafe123"';
      const almanac = createMockAlmanac(fileContent);
      
      const result = await sensitiveDataScan({}, almanac);
      
      expect(result).toEqual({
        success: true,
        findings: [{
          type: 'password',
          line: 1,
          match: 'password="unsafe123"'
        }],
        timestamp: expect.any(String)
      });
    });

    it('should handle custom patterns', async () => {
      const fileContent = 'secret: mysecret123';
      const almanac = createMockAlmanac(fileContent);
      const params = {
        patterns: {
          secret: /secret:\s*(\w+)/
        }
      };
      
      const result = await sensitiveDataScan(params, almanac);
      
      expect(result).toEqual({
        success: true,
        findings: [{
          type: 'secret',
          line: 1,
          match: 'secret: mysecret123'
        }],
        timestamp: expect.any(String)
      });
    });
  });
});
