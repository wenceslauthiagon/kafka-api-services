import * as path from 'path';
import { Logger } from 'winston';
import { appendFile } from 'fs/promises';
import {
  CreateReportUserRepresentorPspRequest,
  ReportGateway,
} from '@zro/reports/application';
import { Sanitize } from '@zro/e-guardian/utils/sanitize.util';
import { ReportExport } from '@zro/reports/domain';
import { CreateReportGatewayException } from '@zro/e-guardian/infrastructure';
import { UserLegalRepresentor, RepresentorType } from '@zro/users/domain';
import { isCpf, getMoment } from '@zro/common';

const DATE_FORMAT = 'YYYYMMDD';

enum EguardianRepresentorType {
  PARTNER = '01',
  ATTORNEY = '02',
  ADMINISTRATOR = '03',
  OTHER = '04',
}

enum EguardianRepresentorPersonType {
  F = 'F',
  J = 'J',
}

interface IEguardianReportRepresentorFile {
  cd_titular: string;
  cd_cpf_cnpj: string;
  cd_nie: string;
  de_pais_ne: string;
  cd_tp_cliente: EguardianRepresentorPersonType;
  nm_titular: string;
  dt_nascimento: string;
  de_nome_mae: string;
  de_endereco: string;
  de_cidade: string;
  de_uf: string;
  de_pais: string;
  cd_fone: string;
  pc_participacao: number;
  cd_tp_papel: EguardianRepresentorType;
  fl_pep: string;
  dt_inicio_relacionamento: string;
  dt_fim_relacionamento: string;
  dt_atualizacao_cadastral: string;
  cd_cep: string;
  fl_servidor_publico: number;
}

export class EguardianCreateReportUserRepresentorGateway
  implements Pick<ReportGateway, 'createReportUserRepresentor'>
{
  constructor(private readonly logger: Logger) {
    this.logger = logger.child({
      context: EguardianCreateReportUserRepresentorGateway.name,
    });
  }

  async createReportUserRepresentor(
    request: CreateReportUserRepresentorPspRequest,
  ): Promise<void> {
    try {
      const report = this.formatReport(request.userLegalRepresentor);

      const content = Object.values(report).join('|').replace(/$/g, '\r');

      await appendFile(
        this.getDestination(request.reportExport),
        new Uint8Array(Buffer.from(content)),
      );
    } catch (error) {
      throw new CreateReportGatewayException(error);
    }
  }

  private formatReport(
    userLegalRepresentor: UserLegalRepresentor,
  ): IEguardianReportRepresentorFile {
    // Is necessary format de fields before send (like sanitize the length). Here we are just pick them.

    const typeMapper = {
      [RepresentorType.PARTNER]: EguardianRepresentorType.PARTNER,
      [RepresentorType.ATTORNEY]: EguardianRepresentorType.ATTORNEY,
      [RepresentorType.ADMINISTRATOR]: EguardianRepresentorType.ADMINISTRATOR,
      [RepresentorType.OTHER]: EguardianRepresentorType.OTHER,
    };

    return {
      cd_titular: userLegalRepresentor.user.uuid.slice(0, 20),
      cd_cpf_cnpj:
        userLegalRepresentor.document &&
        Sanitize.removeSpecialCharacters(userLegalRepresentor.document),
      cd_nie: null,
      de_pais_ne: null,
      cd_tp_cliente: isCpf(userLegalRepresentor.document)
        ? EguardianRepresentorPersonType.F
        : EguardianRepresentorPersonType.J,
      nm_titular:
        userLegalRepresentor.name &&
        Sanitize.removeAccentuation(userLegalRepresentor.name),
      dt_nascimento: getMoment(userLegalRepresentor.birthDate).format(
        DATE_FORMAT,
      ),
      de_nome_mae: null,
      de_endereco: Sanitize.removeAccentuation(
        `${userLegalRepresentor.address.street} ${userLegalRepresentor.address.number} ${userLegalRepresentor.address.complement}`,
      ),
      de_cidade:
        userLegalRepresentor.address.city &&
        Sanitize.removeAccentuation(userLegalRepresentor.address.city),
      de_uf: userLegalRepresentor.address.federativeUnit,
      de_pais:
        userLegalRepresentor.address.country &&
        Sanitize.removeAccentuation(userLegalRepresentor.address.country),
      cd_fone: null,
      pc_participacao: null,
      cd_tp_papel: typeMapper[userLegalRepresentor.type],
      fl_pep: null,
      dt_inicio_relacionamento: getMoment(
        userLegalRepresentor.createdAt,
      ).format(DATE_FORMAT),
      dt_fim_relacionamento: null,
      dt_atualizacao_cadastral: getMoment(
        userLegalRepresentor.updatedAt,
      ).format(DATE_FORMAT),
      cd_cep:
        userLegalRepresentor.address.zipCode &&
        Sanitize.removeSpecialCharacters(userLegalRepresentor.address.zipCode),
      fl_servidor_publico: userLegalRepresentor.isPublicServer ? 1 : 0,
    };
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }
}
