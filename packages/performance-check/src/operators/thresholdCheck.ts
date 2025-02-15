import { OperatorDefn, logger } from 'x-fidelity';

export const thresholdCheckOperator: OperatorDefn = {
  name: 'thresholdCheck',
  fn: (responseData: any, threshold: number) => {
    logger.debug({ op: 'thresholdCheck', threshold }, 'operator called');
    
    if (!responseData?.responseTime || typeof responseData.responseTime !== 'number') {
      logger.debug({ op: 'thresholdCheck', responseData }, 'invalid input');
      return false;
    }
    
    const result = responseData.responseTime <= threshold;
    
    logger.debug({ 
      op: 'thresholdCheck',
      responseTime: responseData.responseTime,
      threshold,
      result 
    }, 'check complete');
    
    return result;
  }
};
