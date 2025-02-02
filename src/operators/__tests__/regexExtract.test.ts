import { regexExtractOperator } from '../regexExtract';

describe('regexExtract Operator', () => {
  const { fn: regexExtract } = regexExtractOperator;

  it.each([
    [null, '.*', false, 'null input'],
    [{}, '.*', false, 'empty object'],
    [{ result: null }, '.*', false, 'null result'],
    [{ result: [] }, '.*', false, 'empty result array'],
    [{ result: ['match'] }, '.*', true, 'valid match'],
  ])('should handle %s case', (input, pattern, expected, _desc) => {
    expect(regexExtract(input, pattern)).toBe(expected);
  });
});
