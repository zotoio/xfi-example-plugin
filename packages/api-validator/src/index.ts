import type { PluginError, XFiPlugin } from 'x-fidelity';
import { logger } from 'x-fidelity';
import { version } from '../package.json';
import { regexExtractOperator } from './operators/regexExtract';
import { externalCallFact } from './facts/externalApiCall';

const plugin: XFiPlugin = {
  name: 'xfi-example-plugin',
  version,  // Use version from package.json
  operators: [regexExtractOperator],
  facts: [externalCallFact],
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

logger.info({ 
  op: 'init',
  version: plugin.version,
  operatorCount: plugin.operators?.length ?? 0,  
  factCount: plugin.facts?.length ?? 0  
}, 'initializing xfi-example-plugin');

export { plugin as default };
