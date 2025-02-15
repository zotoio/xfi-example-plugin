import { Plugin } from 'x-fidelity';
import { sensitiveDataScanFact } from './facts/sensitiveDataScan';
import { securityRuleCheckOperator } from './operators/securityRuleCheck';

export const plugin: Plugin = {
  name: 'security-scanner',
  version: '1.0.0',
  facts: [sensitiveDataScanFact],
  operators: [securityRuleCheckOperator]
};
