export const isMobilePhone = (phone: string): boolean => {
  return !!phone && /^\+([0-9]{13})$/.test(phone);
};
