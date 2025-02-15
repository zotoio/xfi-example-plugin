import { logger, PluginError, XFiPlugin } from 'x-fidelity';
import { version } from '../package.json';
import { sensitiveDataScanFact } from './facts/sensitiveDataScan';
import { securityRuleCheckOperator } from './operators/securityRuleCheck';

const plugin: XFiPlugin = {
  name: 'xfiPluginSecurityScanner',
  version,
  facts: [sensitiveDataScanFact],
  operators: [securityRuleCheckOperator],
  onError: (error: Error): PluginError => {
    const isPluginError = (error as any).isPluginError;
    const level = isPluginError ? (error as any).level : 'fatality';
    
    const pluginError: PluginError = {
      message: isPluginError ? error.message : error.message,
      level,
      details: isPluginError ? (error as any).details : {
        errorName: 'PluginError',
        stack: error.stack
      }
    };

    logger.error({ 
      op: 'error',
      err: error,
      isPluginError,
      level
    }, 'Plugin error occurred');

    return pluginError;
  }
};

export { plugin };
