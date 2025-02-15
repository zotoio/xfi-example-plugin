import { plugin } from './xfiPluginSecurityScanner';

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

describe('Plugin: xfiPluginSecurityScanner', () => {

  describe('Plugin Configuration', () => {
    it('should have correct structure', () => {
      expect(plugin).toMatchObject({
        name: 'xfiPluginSecurityScanner',
        version: expect.any(String),
        operators: expect.any(Array),
        facts: expect.any(Array),
        onError: expect.any(Function)
      });
      
      expect(plugin.operators).toHaveLength(1);
      expect(plugin.facts).toHaveLength(1);
    });

    it('should handle plugin errors correctly', () => {
      const error = new Error('Test error');
      (error as any).isPluginError = true;
      (error as any).level = 'warning';
      (error as any).details = { test: true };

      if (plugin.onError) {
        const result = plugin.onError(error);
        expect(result).toMatchObject({
          level: 'warning',
          message: 'Test error',
          details: { test: true }
        });
      }
    });

    it('should handle non-plugin errors as fatal', () => {
      const error = new Error('Regular error');
      if (plugin.onError) {
        const result = plugin.onError(error);
        expect(result).toMatchObject({
          level: 'fatality',
          message: 'Regular error',
          details: {
            errorName: 'PluginError',
            stack: expect.stringContaining('Error: Regular error')
          }
        });
      }
    });
  });
});
