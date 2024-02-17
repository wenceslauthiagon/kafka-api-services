import * as path from 'path';
import { Logger } from 'winston';
import { appendFile } from 'fs/promises';
import {
  CreateReportUserPspRequest,
  ReportGateway,
} from '@zro/reports/application';
import {
  ReportExport,
  ReportUser,
  ReportUserProfileType,
} from '@zro/reports/domain';
import { CreateReportGatewayException } from '@zro/e-guardian/infrastructure';
import { Sanitize } from '@zro/e-guardian/utils/sanitize.util';
import { PersonType } from '@zro/users/domain';
import { getMoment } from '@zro/common';

const DATE_FORMAT = 'YYYYMMDD';
const DEFAULT_DATE = '19000101';

enum EguardianClientLimitType {
  COMPLIANCE = 'Limite Compliance',
  SUPPORT = 'Limite Suporte',
}

enum EguardianDefault {
  CONFIRMATION_REGISTER = 'Automático',
}

interface IEguardianReportClientFile {
  cd_cliente: string;
  de_cliente: string;
  cd_tip_cliente: string;
  de_endereco: string;
  de_cidade: string;
  de_estado: string;
  de_pais: string;
  cd_cep: string;
  de_fone1: string;
  de_fone2: string;
  dt_abertura_rel: string;
  cic_cpf: string;
  ds_grupo_client: string;
  de_endereco_res: string;
  de_cidade_res: string;
  de_estado_res: string;
  de_pais_res: string;
  cd_cep_res: string;
  de_endereco_cml: string;
  de_cidade_cml: string;
  de_estado_cml: string;
  de_pais_cml: string;
  cd_cep_cml: string;
  dt_desativacao: string;
  dt_ult_alteracao: string;
  ds_ramo_atv: string;
  fl_fundo_invest: number;
  fl_cli_eventual: number;
  de_respons_cadastro: string;
  de_conf_cadastro: string;
  cd_risco: number;
  cd_naic: string;
  de_linha_negocio: string;
  fl_cadastro_proc: number;
  fl_nao_residente: number;
  fl_grandes_fortunas: number;
  de_pais_sede: string;
  de_sit_cadastro: string;
  fl_bloqueado: number;
  cd_risco_inerente: number;
  dt_constituicao: string;
  ip_eletronico: string;
  de_email: string;
  fl_relacionamento_terceiros: number;
  fl_admin_cartoes: number;
  fl_empresa_trust: number;
  fl_facilitadora_pagto: number;
  cd_nat_juridica: string;
  fl_emp_regulada: number;
}

export class EguardianCreateReportUserGateway
  implements Pick<ReportGateway, 'createReportUser'>
{
  constructor(private readonly logger: Logger) {
    this.logger = logger.child({
      context: EguardianCreateReportUserGateway.name,
    });
  }

  async createReportUser(request: CreateReportUserPspRequest): Promise<void> {
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

  private formatReport(reportUser: ReportUser): IEguardianReportClientFile {
    // Is necessary format de fields before send (like sanitize the length). Here we are just pick them.

    return {
      cd_cliente: reportUser.user.uuid.slice(0, 20),
      de_cliente:
        reportUser.user.fullName &&
        Sanitize.removeAccentuation(reportUser.user.fullName),
      cd_tip_cliente:
        reportUser.user.type === PersonType.NATURAL_PERSON
          ? ReportUserProfileType.PF
          : ReportUserProfileType.PJ,
      de_endereco: Sanitize.removeAccentuation(
        `${reportUser.address.street} ${reportUser.address.number} ${reportUser.address.complement}`,
      ),
      de_cidade:
        reportUser.address.city &&
        Sanitize.removeAccentuation(reportUser.address.city),
      de_estado: reportUser.address.federativeUnit,
      de_pais:
        reportUser.address.country &&
        Sanitize.removeAccentuation(reportUser.address.country),
      cd_cep:
        reportUser.address.zipCode &&
        Sanitize.removeSpecialCharacters(reportUser.address.zipCode),
      de_fone1:
        reportUser.user.phoneNumber &&
        Sanitize.removeSpecialCharacters(reportUser.user.phoneNumber),
      de_fone2: null,
      dt_abertura_rel: reportUser.onboarding?.updatedAt
        ? getMoment(reportUser.onboarding.updatedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      cic_cpf:
        reportUser.user.document &&
        Sanitize.removeSpecialCharacters(reportUser.user.document),
      // Necessary review this metric.
      ds_grupo_client:
        reportUser.userLimit.dailyLimit > 10000000
          ? EguardianClientLimitType.COMPLIANCE
          : EguardianClientLimitType.SUPPORT,
      de_endereco_res: Sanitize.removeAccentuation(
        `${reportUser.address.street} ${reportUser.address.number} ${reportUser.address.complement}`,
      ),
      de_cidade_res:
        reportUser.address.city &&
        Sanitize.removeAccentuation(reportUser.address.city),
      de_estado_res: reportUser.address.federativeUnit,
      de_pais_res:
        reportUser.address.country &&
        Sanitize.removeAccentuation(reportUser.address.country),
      cd_cep_res:
        reportUser.address.zipCode &&
        Sanitize.removeSpecialCharacters(reportUser.address.zipCode),
      de_endereco_cml: null,
      de_cidade_cml: null,
      de_estado_cml: null,
      de_pais_cml: null,
      cd_cep_cml: null,
      dt_desativacao: reportUser.user.deletedAt
        ? getMoment(reportUser.user.deletedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      dt_ult_alteracao:
        reportUser.user.updatedAt > reportUser.onboarding.updatedAt
          ? getMoment(reportUser.user.updatedAt).format(DATE_FORMAT)
          : getMoment(reportUser.onboarding.updatedAt).format(DATE_FORMAT),
      ds_ramo_atv: null,
      fl_fundo_invest: 0,
      fl_cli_eventual: 0,
      de_respons_cadastro: null,
      de_conf_cadastro: reportUser.admin.name
        ? Sanitize.removeAccentuation(reportUser.admin.name)
        : EguardianDefault.CONFIRMATION_REGISTER,
      cd_risco: 0,
      cd_naic: null,
      de_linha_negocio: null,
      fl_cadastro_proc: 0,
      fl_nao_residente: 0,
      fl_grandes_fortunas: 0,
      de_pais_sede: null,
      de_sit_cadastro: reportUser.user.state,
      fl_bloqueado: 0,
      cd_risco_inerente: 0,
      dt_constituicao: DEFAULT_DATE,
      ip_eletronico: null,
      de_email: reportUser.user.email,
      fl_relacionamento_terceiros: 0,
      fl_admin_cartoes: 0,
      fl_empresa_trust: 0,
      fl_facilitadora_pagto: 0,
      cd_nat_juridica: null,
      fl_emp_regulada: 0,
    };
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }
}
