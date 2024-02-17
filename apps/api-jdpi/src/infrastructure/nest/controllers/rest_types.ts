import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { formatAccountNumber, formatBranch } from '@zro/common';
import { JdpiAccountType, JdpiPersonType } from '@zro/jdpi/domain';

export type THandleNotifyCreditEventResponse = {
  idReqJdPi: string;
  idCreditoSgct: string;
  dtHrCreditoSgct: Date;
};

export class NotifyCreditPerson {
  @ApiProperty({
    description: 'Bank Ispb number.',
    example: 12345678,
  })
  ispb: number;

  @ApiProperty({
    description: 'Person type.',
    example: JdpiPersonType.LEGAL_PERSON,
    enum: JdpiPersonType,
  })
  tpPessoa: JdpiPersonType;

  @ApiProperty({
    description: 'Document.',
    example: 43958123811,
  })
  cpfCnpj: number;

  @ApiPropertyOptional({
    description: 'Branch number.',
    example: '1234',
  })
  @Transform((params) => params.value && formatBranch(params.value))
  nrAgencia?: string;

  @ApiProperty({
    description: 'Account type.',
    enum: JdpiAccountType,
    example: JdpiAccountType.PAYMENT_ACCOUNT,
  })
  tpConta: JdpiAccountType;

  @ApiProperty({
    description: 'Account number.',
    example: '12345678',
  })
  @Transform((params) => params.value && formatAccountNumber(params.value))
  nrConta: string;

  @ApiProperty({
    description: 'Person Name.',
    example: 'Test Name',
  })
  nome: string;
}

export type TNotifyCreditThirdPart = NotifyCreditPerson;

export type TNotifyCreditClient = Pick<
  NotifyCreditPerson,
  'cpfCnpj' | 'ispb' | 'nrAgencia' | 'nrConta' | 'tpConta' | 'tpPessoa'
>;

export class NotifyCreditThirdPart
  extends NotifyCreditPerson
  implements TNotifyCreditThirdPart {}

export class NotifyCreditClient
  extends NotifyCreditPerson
  implements TNotifyCreditClient {}
