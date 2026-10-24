import { describe, expect, it } from 'vitest';
import { toChartMonths } from './meetingStats.js';

describe('toChartMonths', () => {
  it('keeps the server counts and adds locale labels for each month', () => {
    const [month] = toChartMonths([{ month: '2026-10', organized: 2, invited: 1, participants: 9 }]);

    expect(month).toEqual({
      key: '2026-10',
      label: new Date(2026, 9, 1).toLocaleDateString(undefined, { month: 'short' }),
      fullLabel: new Date(2026, 9, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      organized: 2,
      invited: 1,
      participants: 9,
    });
  });
});
