import { SetMetadata } from '@nestjs/common';

export const IS_FILE_RESPONSE = 'isFile';

/**
 * File decorator. Controllers or handlers decorated with @File will return a different response than the ResponseInterceptor
 */
export const File = () => SetMetadata(IS_FILE_RESPONSE, true);
