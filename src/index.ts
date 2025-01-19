import { XFiPlugin, OperatorDefn, FactDefn } from 'x-fidelity';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const regexExtractOperator: OperatorDefn = {
  name: 'regexExtract',
  fn: (repoFileAnalysis: any, pattern: string) => {
    if (!repoFileAnalysis?.result || !Array.isArray(repoFileAnalysis.result)) {
      return false;
    }
    return repoFileAnalysis.result.length > 0;
  }
};

const externalCallFact: FactDefn = {
  name: 'externalApiCall',
  fn: async (params: any, almanac: any) => {
    try {
      const fileData = await almanac.factValue('fileData');
      if (!fileData) {
        return { 
          success: false, 
          error: 'No file data available',
          timestamp: new Date().toISOString()
        };
      }
      const fileContent = fileData.fileContent;
      
      // Extract value using regex
      const regex = new RegExp(params.regex);
      const match = regex.exec(fileContent);
      const extractedValue = match ? match[1] : null;

      if (!extractedValue) {
        return { success: false, reason: 'No match found' };
      }

      // Make external API call
      const response = await axios.post(params.url, 
        params.includeValue ? { value: extractedValue } : undefined,
        {
          headers: params.headers || {},
          timeout: params.timeout || 5000
        }
      );

      return {
        success: true,
        extractedValue,
        apiResponse: response.data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
};

const loadRulesFromDirectory = (dirPath: string): any[] => {
  const rules: any[] = [];
  try {
    const files = fs.readdirSync(dirPath);
    if (!files) return rules;
    
    const ruleFiles = files.filter(file => file.endsWith('-rule.json'));

  for (const file of ruleFiles) {
    const filePath = path.join(dirPath, file);
    const ruleContent = fs.readFileSync(filePath, 'utf8');
    try {
      const rule = JSON.parse(ruleContent);
      rules.push(rule);
    } catch (error) {
      console.error(`Error parsing rule file ${file}:`, error);
    }
  }
  return rules;
};

export interface ExtendedXFiPlugin extends XFiPlugin {
  operators: OperatorDefn[];
  facts: FactDefn[];
  sampleRules: any[];
}

const plugin: ExtendedXFiPlugin = {
  name: 'xfi-example-plugin',
  version: '1.0.0',
  operators: [regexExtractOperator],
  facts: [externalCallFact],
  sampleRules: []
};

// Load rules after plugin is defined
try {
  plugin.sampleRules = loadRulesFromDirectory(path.join(__dirname, 'rules'));
} catch (error) {
  console.error('Failed to load rules:', error);
}

export { plugin };
export default plugin;
