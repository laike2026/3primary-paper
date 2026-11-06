export function isCalendarDate(value: string) {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validDateRange(from: string, to: string) {
  return (!from || isCalendarDate(from)) && (!to || isCalendarDate(to)) && (!from || !to || from <= to);
}
