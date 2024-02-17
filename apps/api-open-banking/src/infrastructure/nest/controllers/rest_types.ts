import { HttpStatus } from '@nestjs/common';

export const headerApplicationJose = {
  'Content-Type': 'application/jose',
};

export interface BcbError {
  type: string;
  title: string;
  status: HttpStatus;
  detail: string;
}

export const bcbNotFoundError: BcbError = {
  type: 'https://pix.bcb.gov.br/api/v2/error/CobPayloadNaoEncontrado',
  title: 'Cobrança Inexistente',
  status: HttpStatus.NOT_FOUND,
  detail:
    'A cobrança em questão não foi encontrada para a location requisitada.',
};

export const bcbServiceUnavailableError: BcbError = {
  type: 'https://pix.bcb.gov.br/api/v2/error/ServicoIndisponivel',
  title: 'Serviço Indisponível',
  status: HttpStatus.SERVICE_UNAVAILABLE,
  detail:
    'Serviço não está disponível no momento. Serviço solicitado pode estar em manutenção ou fora da janela de funcionamento.',
};

export const bcbGoneError: BcbError = {
  type: 'https://pix.bcb.gov.br/api/v2/error/CobPayloadNaoEncontrado',
  title: 'Cobrança Expirada',
  status: HttpStatus.GONE,
  detail: 'A cobrança em questão está expirada',
};
