import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  JdpiErrorTypes,
  JdpiPixInfractionAnalysisResultType,
  JdpiPixInfractionReason,
  JdpiPixInfractionStatus,
  JdpiPixInfractionType,
  JdpiTypeDomainInfraction,
  JdpiTypeTransactionReported,
} from '@zro/jdpi/domain';

export const success = () => {
  return Promise.resolve({
    status: 200,
    data: {
      reporteInfracao: [
        {
          ispb: faker.datatype.string(),
          endToEndId: faker.datatype.uuid(),
          motivo: JdpiPixInfractionType.REFUND_REQUEST,
          tpSitOrigem: JdpiPixInfractionReason.FRAUD,
          tpInfracao: JdpiTypeDomainInfraction.RETURN_REQUEST,
          stRelatoInfracao: JdpiPixInfractionStatus.OPEN,
          detalhes: faker.datatype.string(),
          idRelatoInfracao: faker.datatype.uuid(),
          pspCriador: faker.datatype.number({ max: 99999999 }),
          pspContraParte: faker.datatype.number({ max: 99999999 }),
          dtHrCriacaoRelatoInfracao: new Date(),
          dtHrUltModificacao: new Date(),
          resultadoAnalise: JdpiPixInfractionAnalysisResultType.AGREED,
          detalhesAnalise: faker.datatype.string(),
        },
        {
          ispb: faker.datatype.string(),
          endToEndId: faker.datatype.uuid(),
          motivo: JdpiPixInfractionType.REFUND_REQUEST,
          tpSitOrigem: JdpiPixInfractionReason.FRAUD,
          tpInfracao: JdpiTypeDomainInfraction.RETURN_REQUEST,
          stRelatoInfracao: JdpiPixInfractionStatus.OPEN,
          detalhes: faker.datatype.string(),
          idRelatoInfracao: faker.datatype.uuid(),
          pspContraParte: faker.datatype.number({ max: 99999999 }),
          ispbCreditado: faker.datatype.number({ max: 99999999 }),
          dtHrCriacaoRelatoInfracao: new Date(),
          dtHrUltModificacao: new Date(),
          resultadoAnalise: JdpiPixInfractionAnalysisResultType.AGREED,
          detalhesAnalise: faker.datatype.string(),
        },
      ],
    },
  });
};

export const invalidOperationType = () => {
  return Promise.resolve({
    status: 200,
    data: {
      reporteInfracao: [
        {
          ispb: faker.datatype.string(),
          endToEndId: faker.datatype.uuid(),
          tpTransacao: JdpiTypeTransactionReported.INTERNAL,
          tpInfracao: 10,
          stRelatoInfracao: JdpiPixInfractionStatus.OPEN,
          detalhes: faker.datatype.string(),
          idRelatoInfracao: faker.datatype.uuid(),
          ispbDebitado: faker.datatype.number({ max: 99999999 }),
          ispbCreditado: faker.datatype.number({ max: 99999999 }),
          dtHrCriacaoRelatoInfracao: new Date(),
          dtHrUltModificacao: new Date(),
          resultadoAnalise: JdpiPixInfractionAnalysisResultType.AGREED,
          detalhesAnalise: faker.datatype.string(),
        },
        {
          ispb: faker.datatype.string(),
          endToEndId: faker.datatype.uuid(),
          tpTransacao: JdpiTypeTransactionReported.INTERNAL,
          tpInfracao: 13,
          stRelatoInfracao: JdpiPixInfractionStatus.OPEN,
          detalhes: faker.datatype.string(),
          idRelatoInfracao: faker.datatype.uuid(),
          ispbDebitado: faker.datatype.number({ max: 99999999 }),
          ispbCreditado: faker.datatype.number({ max: 99999999 }),
          dtHrCriacaoRelatoInfracao: new Date(),
          dtHrUltModificacao: new Date(),
          resultadoAnalise: JdpiPixInfractionAnalysisResultType.AGREED,
          detalhesAnalise: faker.datatype.string(),
        },
      ],
    },
  });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};

export const unexpectedError = () => {
  const error = {
    response: {
      data: {
        codigo: 'Unexpected Error',
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};
