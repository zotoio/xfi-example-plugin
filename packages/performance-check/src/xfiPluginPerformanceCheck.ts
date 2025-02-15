import { XFiPlugin } from 'x-fidelity';
import { version } from '../package.json';
import { responseTimeFact } from './facts/responseTime';
import { thresholdCheckOperator } from './operators/thresholdCheck';

export const plugin: XFiPlugin = {
  name: 'xfiPluginPerformanceCheck',
  version,
  facts: [responseTimeFact],
  operators: [thresholdCheckOperator]
};
