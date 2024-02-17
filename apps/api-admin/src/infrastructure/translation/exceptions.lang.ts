import { HttpStatus } from '@nestjs/common';

const ptBrDefaultException = {
  DEFAULT: 'Por favor, tente novamente.',
  MISSING_DATA: 'Falta dados',
  USER_NOT_FOUND: 'Usuário não encontrado',
};

const DefaultExceptionMessage = {
  'pt-BR': ptBrDefaultException,
};

export function translateErrorMessage(errorCode: string, lang = 'pt-BR') {
  if (
    DefaultExceptionMessage[lang] &&
    DefaultExceptionMessage[lang][errorCode]
  ) {
    return DefaultExceptionMessage[lang][errorCode];
  }

  return DefaultExceptionMessage['pt-BR']['DEFAULT'];
}

const ptBrHttpException = {
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Por favor, tente novamente.',
  [HttpStatus.BAD_REQUEST]: 'Verifique os dados e tente novamente.',
  [HttpStatus.FORBIDDEN]: 'Acesso negado.',
  [HttpStatus.UNAUTHORIZED]: 'Accesso não autorizado.',
};

const HttpExceptionMessage = {
  'pt-BR': ptBrHttpException,
};

export function translateHttpErrorMessage(
  errorCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  lang = 'pt-BR',
) {
  if (HttpExceptionMessage[lang] && HttpExceptionMessage[lang][errorCode]) {
    return HttpExceptionMessage[lang][errorCode];
  }

  return HttpExceptionMessage['pt-BR'][HttpStatus.INTERNAL_SERVER_ERROR];
}
