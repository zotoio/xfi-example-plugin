import { XFiPlugin, OperatorDefn, FactDefn, logger } from 'x-fidelity';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const regexExtractOperator: OperatorDefn = {
  name: 'regexExtract',
  fn: (repoFileAnalysis: any, pattern: string) => {
    logger.debug(`regexExtract operator called: ${JSON.stringify({ pattern })}`);
    
    if (!repoFileAnalysis?.result || !Array.isArray(repoFileAnalysis.result)) {
      logger.debug(`regexExtract: Invalid input: ${JSON.stringify({ repoFileAnalysis })}`);
      return false;
    }
    
    logger.debug(`regexExtract result: ${JSON.stringify({ 
      matches: repoFileAnalysis.result.length,
      result: repoFileAnalysis.result 
    })}`);
    return repoFileAnalysis.result.length > 0;
  }
};

const externalCallFact: FactDefn = {
  name: 'externalApiCall',
  fn: async (params: any, almanac: any) => {
    logger.debug(`externalApiCall fact called: ${JSON.stringify({ params })}`);
    
    try {
      const fileData = await almanac.factValue('fileData');
      if (!fileData) {
        logger.warn(`externalApiCall: No file data available`);
        return { 
          success: false, 
          error: 'No file data available',
          timestamp: new Date().toISOString()
        };
      }
      
      const fileContent = fileData.fileContent;
      logger.debug(`File content loaded: ${JSON.stringify({ length: fileContent.length })}`);
      
      // Extract value using regex
      const regex = new RegExp(params.regex);
      const match = regex.exec(fileContent);
      const extractedValue = match ? match[1] : null;

      if (!extractedValue) {
        logger.debug(`No regex match found: ${JSON.stringify({ pattern: params.regex })}`);
        return { success: false, reason: 'No match found' };
      }
      
      logger.debug(`Value extracted: ${JSON.stringify({ extractedValue })}`);

      // Make external API call
      logger.debug(`Making API call: ${JSON.stringify({ 
        url: params.url,
        includeValue: params.includeValue,
        timeout: params.timeout || 5000
      })}`);
      
      const response = await axios.post(params.url, 
        params.includeValue ? { value: extractedValue } : undefined,
        {
          headers: params.headers || {},
          timeout: params.timeout || 5000
        }
      );

      logger.debug(`API call successful: ${JSON.stringify({ 
        status: response.status,
        responseLength: JSON.stringify(response.data).length 
      })}`);

      return {
        success: true,
        extractedValue,
        apiResponse: response.data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`externalApiCall error ${ JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
};

const loadRulesFromDirectory = (dirPath: string): any[] => {
  logger.debug(`Loading rules from directory: ${JSON.stringify({ dirPath })}`);
  const rules: any[] = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    if (!files) {
      logger.warn(`No files found in rules directory`);
      return rules;
    }
    
    const ruleFiles = files.filter(file => file.endsWith('-rule.json'));
    logger.debug(`Found rule files: ${JSON.stringify({ count: ruleFiles.length, files: ruleFiles })}`);

    for (const file of ruleFiles) {
      const filePath = path.join(dirPath, file);
      logger.debug(`Reading rule file: ${JSON.stringify({ filePath })}`);
      
      const ruleContent = fs.readFileSync(filePath, 'utf8');
      try {
        const rule = JSON.parse(ruleContent);
        rules.push(rule);
        logger.debug(`Successfully parsed rule: ${JSON.stringify({ ruleName: rule.name })}`);
      } catch (error) {
        logger.error(`Error parsing rule file: ${JSON.stringify({ 
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        })}`);
      }
    }
    return rules;
  } catch (error) {
    logger.error(`Error reading rules directory: ${JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })}`);
    return rules;
  }
};

// Create the plugin instance with required properties
const plugin: XFiPlugin = {
  name: 'xfi-example-plugin',
  version: '1.0.0',
  operators: [regexExtractOperator],
  facts: [externalCallFact],
  sampleRules: []
} as const;  // Use const assertion to ensure properties are defined

logger.info(`Initializing xfi-example-plugin: ${JSON.stringify({ 
  version: plugin.version,
  operatorCount: plugin.operators?.length ?? 0,  // Safe access with fallback
  factCount: plugin.facts?.length ?? 0  // Safe access with fallback
})}`);

// Load rules after plugin is defined
try {
  plugin.sampleRules = loadRulesFromDirectory(path.join(__dirname, 'rules'));
  logger.info(`Plugin initialization complete: ${JSON.stringify({ 
    rulesLoaded: plugin.sampleRules.length 
  })}`);
} catch (error) {
  logger.error(`Failed to load rules during plugin initialization: ${JSON.stringify({
    error: error instanceof Error ? error.message : 'Unknown error'
  })}`);
}

export { plugin as default, loadRulesFromDirectory };
