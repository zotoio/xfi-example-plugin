import { logger, PluginError, XFiPlugin } from 'x-fidelity';
import { version } from '../package.json';
import { responseTimeFact } from './facts/responseTime';
import { thresholdCheckOperator } from './operators/thresholdCheck';

const plugin: XFiPlugin = {
  name: 'xfiPluginPerformanceCheck',
  version,
  facts: [responseTimeFact],
  operators: [thresholdCheckOperator],
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