import { OperatorDefn, logger } from 'x-fidelity';

export const regexExtractOperator: OperatorDefn = {
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
