/**
 * Turns the stats endpoint's months ([{ month: 'YYYY-MM', organized, invited, participants }]) into the chart's
 * buckets, adding locale labels. The server already bucketed them in the user's time zone.
 */
export function toChartMonths(months) {
  return months.map(({ month, organized, invited, participants }) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const d = new Date(year, monthNumber - 1, 1);
    return {
      key: month,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      fullLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      organized,
      invited,
      participants,
    };
  });
}
