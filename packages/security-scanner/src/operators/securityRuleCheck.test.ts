import { securityRuleCheckOperator } from './securityRuleCheck';

describe('securityRuleCheck Operator', () => {
  const { fn: securityRuleCheck } = securityRuleCheckOperator;

  describe('Input Validation', () => {
    it.each([
      [null, 0, false, 'null input'],
      [{}, 0, false, 'empty object'],
      [{ findings: null }, 0, false, 'null findings'],
      [{ findings: 'not-array' }, 0, false, 'non-array findings']
    ])('should handle %s case', (input, threshold, expected, _desc) => {
      expect(securityRuleCheck(input, threshold)).toBe(expected);
    });
  });

  describe('Threshold Checks', () => {
    it.each([
      [{ findings: [] }, 0, true, 'empty findings'],
      [{ findings: [{ type: 'apiKey' }] }, 1, true, 'at threshold'],
      [{ findings: [{ type: 'apiKey' }, { type: 'password' }] }, 1, true, 'over threshold']
    ])('should handle numeric threshold - %s', (input, threshold, expected, _desc) => {
      expect(securityRuleCheck(input, threshold)).toBe(expected);
    });
  });

  describe('Rule-based Checks', () => {
    it.each([
      [
        { findings: [{ type: 'apiKey' }] },
        { apiKey: true },
        true,
        'allowed finding'
      ],
      [
        { findings: [{ type: 'password' }] },
        { password: false },
        false,
        'disallowed finding'
      ],
      [
        { findings: [{ type: 'apiKey' }, { type: 'password' }] },
        { apiKey: true, password: true },
        true,
        'multiple allowed findings'
      ]
    ])('should handle rule-based threshold - %s', (input, rules, expected, _desc) => {
      expect(securityRuleCheck(input, rules)).toBe(expected);
    });
  });
});
