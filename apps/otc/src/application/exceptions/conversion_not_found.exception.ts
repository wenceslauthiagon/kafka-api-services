import { Conversion } from '@zro/otc/domain';
import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CONVERSION_NOT_FOUND')
export class ConversionNotFoundException extends DefaultException {
  constructor(conversion: Partial<Conversion>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CONVERSION_NOT_FOUND',
      data: conversion,
    });
  }
}
