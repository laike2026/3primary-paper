export function campaignValue(value: string | null) {
  const clean = value?.trim() || '';
  return /^[\p{L}\p{N}_. -]{1,80}$/u.test(clean) ? clean : '';
}

export function referralOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : '';
  } catch {
    return '';
  }
}
