import * as path from 'path';
import { Logger } from 'winston';
import { appendFile } from 'fs/promises';
import { Sanitize } from '@zro/e-guardian/utils/sanitize.util';
import {
  CreateReportHolderPspRequest,
  ReportGateway,
} from '@zro/reports/application';
import {
  ReportExport,
  ReportUser,
  ReportUserProfileType,
} from '@zro/reports/domain';
import { CreateReportGatewayException } from '@zro/e-guardian/infrastructure';
import { getMoment } from '@zro/common';

const DATE_FORMAT = 'YYYYMMDD';
const DEFAULT_DATE = '19000101';

interface IEguardianReportHolderFile {
  cd_cliente: string;
  de_cliente_co: string;
  de_end_co: string;
  de_cid_co: string;
  cd_uf: string;
  de_pais_co: string;
  cd_cep_co: string;
  de_fone1_co: string;
  de_fone2_co: string;
  rg: string;
  rg_emissor: string;
  cpf: string;
  nm_pai: string;
  nm_mae: string;
  nm_conjuge: string;
  nacionalidade: string;
  dt_nascimento: string;
  sexo: string;
  ds_profissao: string;
  cd_tp_cliente: string;
  cnpj: string;
  ds_ramo_atv: string;
  cargo: string;
  fl_est_civil: string;
  de_atv_principal: string;
  de_forma_constituicao: string;
  dt_constituicao: string;
  fl_pep: string;
  fl_co_tit_final: number;
  tx_participacao: string;
  de_pais_domicilio: string;
  de_pais_nascimento: string;
  de_natureza: string;
  de_sit_cadsatro: string;
  dt_inicio_relacionamento: string;
  dt_fim_relacionamento: string;
  fl_servidor_publico: number;
}

export class EguardianCreateReportHolderGateway
  implements Pick<ReportGateway, 'createReportHolder'>
{
  constructor(private readonly logger: Logger) {
    this.logger = logger.child({
      context: EguardianCreateReportHolderGateway.name,
    });
  }

  async createReportHolder(
    request: CreateReportHolderPspRequest,
  ): Promise<void> {
    try {
      const report = this.formatReport(request.reportUser);

      const content = Object.values(report).join('|').replace(/$/g, '\r');

      await appendFile(
        this.getDestination(request.reportExport),
        new Uint8Array(Buffer.from(content)),
      );
    } catch (error) {
      throw new CreateReportGatewayException(error);
    }
  }

  private formatReport(reportHolder: ReportUser): IEguardianReportHolderFile {
    // It is necessary to format the fields before sending (like sanitize the length). Here we just pick them.

    return {
      cd_cliente: reportHolder.user.uuid.slice(0, 20),
      de_cliente_co:
        reportHolder.user.fullName &&
        Sanitize.removeAccentuation(reportHolder.user.fullName),
      de_end_co: Sanitize.removeAccentuation(
        `${reportHolder.address.street} ${reportHolder.address.number} ${reportHolder.address.complement}`,
      ),
      de_cid_co:
        reportHolder.address.city &&
        Sanitize.removeAccentuation(reportHolder.address.city),
      cd_uf: reportHolder.address.federativeUnit,
      de_pais_co:
        reportHolder.address.country &&
        Sanitize.removeAccentuation(reportHolder.address.country),
      cd_cep_co:
        reportHolder.address.zipCode &&
        Sanitize.removeSpecialCharacters(reportHolder.address.zipCode),
      de_fone1_co:
        reportHolder.user.phoneNumber &&
        Sanitize.removeSpecialCharacters(reportHolder.user.phoneNumber),
      de_fone2_co: null,
      rg: null,
      rg_emissor: null,
      cpf:
        reportHolder.user.document &&
        Sanitize.removeSpecialCharacters(reportHolder.user.document),
      nm_pai: null,
      nm_mae:
        reportHolder.user.motherName &&
        Sanitize.removeAccentuation(reportHolder.user.motherName),
      nm_conjuge: null,
      nacionalidade:
        reportHolder.address.country &&
        Sanitize.removeAccentuation(reportHolder.address.country),
      dt_nascimento: reportHolder.user.birthDate
        ? getMoment(reportHolder.user.birthDate).format(DATE_FORMAT)
        : DEFAULT_DATE,
      sexo: reportHolder.user.genre,
      ds_profissao:
        reportHolder.occupation?.name &&
        Sanitize.removeAccentuation(reportHolder.occupation?.name),
      cd_tp_cliente: ReportUserProfileType.PF,
      cnpj: null,
      ds_ramo_atv: null,
      cargo: null,
      fl_est_civil: '0',
      de_atv_principal: null,
      de_forma_constituicao: null,
      dt_constituicao: DEFAULT_DATE,
      fl_pep: reportHolder.onboarding.pepSince ? '1' : '0',
      fl_co_tit_final: 0,
      tx_participacao: '0.0',
      de_pais_domicilio:
        reportHolder.address.country &&
        Sanitize.removeAccentuation(reportHolder.address.country),
      de_pais_nascimento:
        reportHolder.address.country &&
        Sanitize.removeAccentuation(reportHolder.address.country),
      de_natureza: null,
      de_sit_cadsatro: null,
      dt_inicio_relacionamento: reportHolder.onboarding?.updatedAt
        ? getMoment(reportHolder.onboarding.updatedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      dt_fim_relacionamento: reportHolder.user.deletedAt
        ? getMoment(reportHolder.user.deletedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      fl_servidor_publico: 0,
    };
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }
}
