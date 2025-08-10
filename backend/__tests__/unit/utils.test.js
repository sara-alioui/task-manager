const { formatDate } = require('../../utils');

describe('Utils', () => {
  test('formatDate() formattage ISO standard', () => {
    const date = new Date('2023-01-01');
    expect(formatDate(date)).toBe('01/01/2023');
  });
});