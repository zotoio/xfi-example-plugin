import type { PluginError, XFiPlugin } from 'x-fidelity';
import { OperatorDefn, FactDefn, logger } from 'x-fidelity';
import axios from 'axios';
import { version } from '../package.json';

const regexExtractOperator: OperatorDefn = {
  name: 'regexExtract',
  fn: (repoFileAnalysis: any, pattern: string) => {
    logger.debug({ op: 'regexExtract', pattern }, 'operator called');
    
    if (!repoFileAnalysis?.result || !Array.isArray(repoFileAnalysis.result)) {
      logger.debug({ op: 'regexExtract', repoFileAnalysis }, 'invalid input');
      return false;
    }
    
    logger.debug({ 
      op: 'regexExtract',
      matches: repoFileAnalysis.result.length,
      result: repoFileAnalysis.result 
    }, 'operation result');
    return repoFileAnalysis.result.length > 0;
  }
};

const externalCallFact: FactDefn = {
  name: 'externalApiCall',
  fn: async (params: any, almanac: any) => {
    logger.debug({ op: 'externalApiCall', params }, 'fact called');
    
    try {
      const fileData = await almanac.factValue('fileData');
      if (!fileData) {
        logger.warn({ op: 'externalApiCall' }, 'no file data available');
        return { 
          success: false, 
          error: 'No file data available',
          timestamp: new Date().toISOString()
        };
      }
      
      const fileContent = fileData.fileContent;
      logger.debug({ op: 'externalApiCall', contentLength: fileContent.length }, 'file content loaded');
      
      // Extract value using regex
      const regex = new RegExp(params.regex);
      const match = regex.exec(fileContent);
      const extractedValue = match ? match[1] : null;

      if (!extractedValue) {
        logger.debug({ op: 'externalApiCall', pattern: params.regex }, 'no regex match found');
        return { success: false, reason: 'No match found' };
      }
      
      logger.debug({ op: 'externalApiCall', extractedValue }, 'value extracted');

      // Make external API call
      logger.debug({ 
        op: 'externalApiCall',
        url: params.url,
        includeValue: params.includeValue,
        timeout: params.timeout || 5000
      }, 'making API call');
      
      const response = await axios.post(params.url, 
        params.includeValue ? { value: extractedValue } : undefined,
        {
          headers: params.headers || {},
          timeout: params.timeout || 5000
        }
      );

      logger.debug({ 
        op: 'externalApiCall',
        status: response?.status,
        responseLength: JSON.stringify(response?.data).length 
      }, 'API call successful');

      return {
        success: true,
        extractedValue,
        apiResponse: response?.data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const pluginError: PluginError = {
        message: 'API call failed',
        level: 'error',
        details: { 
          operation: 'externalApiCall', 
          stack: (error as Error).stack
        }
      };

      logger.error(pluginError, 'API call failed');
      
      throw pluginError;
    }
  }
};

// Create the plugin instance with required properties
const plugin: XFiPlugin = {
  name: 'xfi-example-plugin',
  version,  // Use version from package.json
  operators: [regexExtractOperator],
  facts: [externalCallFact],
  onError: (error: Error): PluginError => {
    
    const pluginError: PluginError = {
      message: 'error parsing rule file',
      level: 'error',
      details: { 
        operation: 'loadRules',
        stack: (error as Error).stack
      }
    };

    logger.error(pluginError, 'Plugin error occurred');
    
    // perform additional actions if needed

    return pluginError;
  }
};

logger.info({ 
  op: 'init',
  version: plugin.version,
  operatorCount: plugin.operators?.length ?? 0,  
  factCount: plugin.facts?.length ?? 0  
}, 'initializing xfi-example-plugin');

export { plugin as default };
