const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

// Parses "4-7 working days" or "7-14 working days" → { min: 4, max: 7 }
function parseDeliveryDays(estimatedDelivery: string): { min: number; max: number } | null {
  const match = estimatedDelivery.match(/(\d+)-(\d+)/);
  if (!match) return null;
  return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
}

export function getDeliveryDateRange(estimatedDelivery: string): string | null {
  const days = parseDeliveryDays(estimatedDelivery);
  if (!days) return null;

  const today = new Date();
  const minDate = addDays(today, days.min);
  const maxDate = addDays(today, days.max);

  const minStr = formatDate(minDate);
  const maxStr = formatDate(maxDate);

  if (minStr === maxStr) return minStr;

  // Include year on maxDate only if it differs from today's year
  const maxFormatted =
    maxDate.getFullYear() !== today.getFullYear()
      ? `${formatDate(maxDate)} ${maxDate.getFullYear()}`
      : maxStr;

  return `${minStr} – ${maxFormatted}`;
}
