export function parseExpirationDate(
  expirationDate: string,
): { expirationMonth: number; expirationYear: number } | null {
  const dateParts = expirationDate.split("/");

  if (dateParts.length !== 2) {
    // Invalid format
    return null;
  }

  const expirationMonth = parseInt(dateParts[0], 10);
  const expirationYear = parseInt(dateParts[1], 10);

  if (isNaN(expirationMonth) || isNaN(expirationYear)) {
    // Invalid month or year
    return null;
  }

  return { expirationMonth, expirationYear };
}
