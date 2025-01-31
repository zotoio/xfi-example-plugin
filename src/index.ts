import type { XFiPlugin } from 'x-fidelity';
import { OperatorDefn, FactDefn, logger } from 'x-fidelity';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
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
        status: response.status,
        responseLength: JSON.stringify(response.data).length 
      }, 'API call successful');

      return {
        success: true,
        extractedValue,
        apiResponse: response.data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error({ 
        op: 'externalApiCall',
        err: error
      }, 'API call failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
};

const loadRulesFromDirectory = (dirPath: string): any[] => {
  logger.debug({ op: 'loadRules', dirPath }, 'loading rules from directory');
  const rules: any[] = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    if (!files) {
      logger.warn({ op: 'loadRules' }, 'no files found in rules directory');
      return rules;
    }
    
    const ruleFiles = files.filter(file => file.endsWith('-rule.json'));
    logger.debug({ 
      op: 'loadRules', 
      count: ruleFiles.length, 
      files: ruleFiles 
    }, 'found rule files');

    for (const file of ruleFiles) {
      const filePath = path.join(dirPath, file);
      logger.debug({ op: 'loadRules', filePath }, 'reading rule file');
      
      const ruleContent = fs.readFileSync(filePath, 'utf8');
      try {
        const rule = JSON.parse(ruleContent);
        rules.push(rule);
        logger.debug({ op: 'loadRules', ruleName: rule.name }, 'successfully parsed rule');
      } catch (error) {
        logger.error({ 
          op: 'loadRules',
          file,
          err: error
        }, 'error parsing rule file');
      }
    }
    return rules;
  } catch (error) {
    logger.error({ 
      op: 'loadRules',
      err: error
    }, 'error reading rules directory');
    return rules;
  }
};

// Create the plugin instance with required properties
const plugin: XFiPlugin = {
  name: 'xfi-example-plugin',
  version,  // Use version from package.json
  operators: [regexExtractOperator],
  facts: [externalCallFact],
  sampleRules: []
} as const;  // Use const assertion to ensure properties are defined

logger.info({ 
  op: 'init',
  version: plugin.version,
  operatorCount: plugin.operators?.length ?? 0,  // Safe access with fallback
  factCount: plugin.facts?.length ?? 0  // Safe access with fallback
}, 'initializing xfi-example-plugin');

// Load rules after plugin is defined
try {
  plugin.sampleRules = loadRulesFromDirectory(path.join(__dirname, 'rules'));
  logger.info({ 
    op: 'init',
    rulesLoaded: plugin.sampleRules.length 
  }, 'plugin initialization complete');
} catch (error) {
  logger.error({ 
    op: 'init',
    err: error
  }, 'failed to load rules during initialization');
}

export { plugin as default, loadRulesFromDirectory };
