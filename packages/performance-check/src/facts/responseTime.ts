import { FactDefn, logger } from 'x-fidelity';
import type { PluginError } from 'x-fidelity';
import axios from 'axios';

export const responseTimeFact: FactDefn = {
  name: 'responseTime',
  fn: async (params: any, almanac: any) => {
    logger.debug({ op: 'responseTime', params }, 'fact called');
    
    try {
      const startTime = Date.now();
      
      const response = await axios.get(params.url, {
        timeout: params.timeout || 5000,
        headers: params.headers || {}
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.debug({ 
        op: 'responseTime',
        url: params.url,
        responseTime,
        status: response.status
      }, 'response time measured');

      return {
        success: true,
        responseTime,
        status: response.status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const pluginError: PluginError = {
        message: 'Response time check failed',
        level: 'error',
        details: { 
          operation: 'responseTime',
          errorName: 'ResponseTimeError',
          stack: (error as Error).stack
        }
      };

      logger.error(pluginError, 'response time check failed');
      
      throw pluginError;
    }
  }
};
