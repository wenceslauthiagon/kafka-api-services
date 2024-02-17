import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public decorator. Controllers or handlers decorated with @Public are NOT
 * protected by JWT guard
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
