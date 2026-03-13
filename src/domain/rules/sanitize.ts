/** Strip HTML tags and trim whitespace from user-provided text. */
export function sanitizeText(input: string, maxLength = 500): string {
  return input.replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}

/** Strip non-digit characters from a phone string. */
export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, '').slice(0, 20);
}
