import validator from 'validator';

export const isEmail = (email: string): boolean => validator.isEmail(email);
