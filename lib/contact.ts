export function telephoneHref(phone: string) {
  const number = phone.trim().replace(/^00/, '+').replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{6,14}$/.test(number) ? `tel:${number}` : '';
}
