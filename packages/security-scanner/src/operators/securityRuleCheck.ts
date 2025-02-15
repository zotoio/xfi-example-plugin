import { OperatorDefn, logger } from 'x-fidelity';

export const securityRuleCheckOperator: OperatorDefn = {
  name: 'securityRuleCheck',
  fn: (scanResult: any, threshold: any) => {
    logger.debug({ op: 'securityRuleCheck', threshold }, 'operator called');
    
    if (!scanResult?.findings || !Array.isArray(scanResult.findings)) {
      logger.debug({ op: 'securityRuleCheck', scanResult }, 'invalid input');
      return false;
    }

    // If threshold is a number, check against findings count
    if (typeof threshold === 'number') {
      const result = scanResult.findings.length <= threshold;
      logger.debug({ 
        op: 'securityRuleCheck',
        findingsCount: scanResult.findings.length,
        threshold,
        result 
      }, 'threshold check complete');
      return result;
    }

    // If threshold is an object, check against specific rules
    if (typeof threshold === 'object') {
      const result = !scanResult.findings.some((finding: any) => 
        threshold[finding.type] === false
      );
      
      logger.debug({ 
        op: 'securityRuleCheck',
        findings: scanResult.findings,
        rules: threshold,
        result 
      }, 'rules check complete');
      
      return result;
    }

    return false;
  }
};
