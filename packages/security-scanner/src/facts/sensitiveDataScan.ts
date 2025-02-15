import { FactDefn, logger } from 'x-fidelity';
import type { PluginError } from 'x-fidelity';

const DEFAULT_PATTERNS = {
  apiKey: /(['"]?(?:api[_-]?key|api[_-]?token)['"]?\s*[:=]\s*['"]([^'"]+)['"])/i,
  password: /(['"]?password['"]?\s*[:=]\s*['"]([^'"]+)['"])/i,
  privateKey: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
};

export const sensitiveDataScanFact: FactDefn = {
  name: 'sensitiveDataScan',
  fn: async (params: any, almanac: any) => {
    logger.debug({ op: 'sensitiveDataScan', params }, 'fact called');
    
    try {
      const fileData = await almanac.factValue('fileData');
      if (!fileData) {
        logger.warn({ op: 'sensitiveDataScan' }, 'no file data available');
        return { 
          success: false, 
          error: 'No file data available',
          timestamp: new Date().toISOString()
        };
      }
      
      const fileContent = fileData.fileContent;
      logger.debug({ op: 'sensitiveDataScan', contentLength: fileContent.length }, 'file content loaded');
      
      const patterns: Record<string, string | RegExp> = params.patterns || DEFAULT_PATTERNS;
      const findings: any[] = [];

      Object.entries(patterns).forEach(([type, pattern]: [string, string | RegExp]) => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const matches = fileContent.match(regex);
        
        if (matches) {
          findings.push({
            type,
            line: fileContent.substring(0, matches.index).split('\n').length,
            match: matches[0]
          });
        }
      });

      logger.debug({ 
        op: 'sensitiveDataScan',
        findingsCount: findings.length 
      }, 'scan complete');

      return {
        success: true,
        findings,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const pluginError: PluginError = {
        message: 'Sensitive data scan failed',
        level: 'error',
        details: { 
          operation: 'sensitiveDataScan',
          errorName: 'ScanError',
          stack: (error as Error).stack
        }
      };

      logger.error(pluginError, 'sensitive data scan failed');
      
      throw pluginError;
    }
  }
};
