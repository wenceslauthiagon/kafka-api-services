import { v4 as uuidV4 } from 'uuid';
import { cpf } from 'cpf-cnpj-validator';
import {
  JdpiErrorTypes,
  JdpiFraudDetectionStatus,
  JdpiPersonType,
  JdpiPixInfractionFraudType,
} from '@zro/jdpi/domain';

export const success = () => {
  return Promise.resolve({
    status: 200,
    data: {
      dtHrJdPi: new Date(),
      marcacoesInfracao: [
        {
          idMarcacaoFraude: uuidV4(),
          tpPessoa: JdpiPersonType.NATURAL_PERSON,
          cpfCnpj: Number(cpf.generate()),
          chave: cpf.generate(),
          tpFraude: JdpiPixInfractionFraudType.FALSE_IDENTIFICATION,
          stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
          dtHrCriacaoMarcacaoFraude: '2023-11-10T14:15:06.951Z',
          dtHrUltModificacao: '2023-11-10T14:15:06.951Z',
        },
        {
          idMarcacaoFraude: uuidV4(),
          tpPessoa: JdpiPersonType.NATURAL_PERSON,
          cpfCnpj: Number(cpf.generate()),
          chave: uuidV4(),
          tpFraude: JdpiPixInfractionFraudType.FALSE_IDENTIFICATION,
          stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
          dtHrCriacaoMarcacaoFraude: new Date(),
          dtHrUltModificacao: new Date(),
        },
        {
          idMarcacaoFraude: uuidV4(),
          tpPessoa: JdpiPersonType.NATURAL_PERSON,
          cpfCnpj: Number(cpf.generate()),
          chave: cpf.generate(),
          tpFraude: JdpiPixInfractionFraudType.FALSE_IDENTIFICATION,
          stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
          dtHrCriacaoMarcacaoFraude: new Date(),
          dtHrUltModificacao: new Date(),
        },
        {
          idMarcacaoFraude: uuidV4(),
          tpPessoa: JdpiPersonType.NATURAL_PERSON,
          cpfCnpj: Number(cpf.generate()),
          chave: uuidV4(),
          tpFraude: JdpiPixInfractionFraudType.FALSE_IDENTIFICATION,
          stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
          dtHrCriacaoMarcacaoFraude: new Date(),
          dtHrUltModificacao: new Date(),
        },
        {
          idMarcacaoFraude: uuidV4(),
          tpPessoa: JdpiPersonType.NATURAL_PERSON,
          cpfCnpj: Number(cpf.generate()),
          chave: cpf.generate(),
          tpFraude: JdpiPixInfractionFraudType.FALSE_IDENTIFICATION,
          stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
          dtHrCriacaoMarcacaoFraude: new Date(),
          dtHrUltModificacao: new Date(),
        },
        {
          idMarcacaoFraude: uuidV4(),
          tpPessoa: JdpiPersonType.NATURAL_PERSON,
          cpfCnpj: Number(cpf.generate()),
          chave: uuidV4(),
          tpFraude: JdpiPixInfractionFraudType.FALSE_IDENTIFICATION,
          stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
          dtHrCriacaoMarcacaoFraude: new Date(),
          dtHrUltModificacao: new Date(),
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
