export function convertStringToCents(amountString: string): number {
  // Remove any non-numeric characters (e.g., commas) and convert to a float
  const amountInDollars = parseFloat(amountString.replace(/[^0-9.]/g, ""));

  // Convert dollars to cents
  const amountInCents = Math.round(amountInDollars * 100);

  return amountInCents;
}
