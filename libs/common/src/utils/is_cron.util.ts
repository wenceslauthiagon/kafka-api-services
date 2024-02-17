/**
 * Check if the value is a valid cron string
 * @param value The value
 * @returns The bool
 */
export const isCron = (value = '') =>
  !!value.match(/((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){6})/);
