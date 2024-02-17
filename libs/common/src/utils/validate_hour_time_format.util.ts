/**
 * Validate if hourTime format is valid (HH:mm)
 * @param hourTime HourTime candidate.
 * @returns True if hourTime format is valid or hourTime is null. False otherwise.
 */
export function validateHourTimeFormat(hourTime: string): boolean {
  if (!hourTime) return true;
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hourTime);
}
