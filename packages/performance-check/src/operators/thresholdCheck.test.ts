import { thresholdCheckOperator } from './thresholdCheck';

describe('thresholdCheck Operator', () => {
  const { fn: thresholdCheck } = thresholdCheckOperator;

  it.each([
    [null, 1000, false, 'null input'],
    [{}, 1000, false, 'empty object'],
    [{ responseTime: null }, 1000, false, 'null response time'],
    [{ responseTime: 500 }, 1000, true, 'under threshold'],
    [{ responseTime: 1500 }, 1000, false, 'over threshold'],
    [{ responseTime: 1000 }, 1000, true, 'at threshold']
  ])('should handle %s case', (input, threshold, expected, _desc) => {
    expect(thresholdCheck(input, threshold)).toBe(expected);
  });
});
