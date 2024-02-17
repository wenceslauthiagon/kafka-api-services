import * as path from 'path';
import { Logger } from 'winston';
import { appendFile } from 'fs/promises';
import { getMoment } from '@zro/common';
import {
  CreateReportPaymentsAccountHolderPspRequest,
  ReportGateway,
} from '@zro/reports/application';
import {
  ReportExport,
  ReportUser,
  ReportPaymentAccountHolderGroupType,
} from '@zro/reports/domain';
import { CreateReportGatewayException } from '@zro/e-guardian/infrastructure';
import { Sanitize } from '@zro/e-guardian/utils/sanitize.util';
import { PersonType } from '@zro/users/domain';

const DATE_FORMAT = 'YYYYMMDD';
const DEFAULT_DATE = '19000101';

enum EguardianPersonType {
  F = 'F',
  J = 'J',
}

interface IEguardianReportPaymentsAccountHolderFile {
  cd_titular: string;
  cd_tp_titular: string;
  ds_grupo_titular: string;
  cd_tp_papel: string;
  de_titular: string;
  cd_cpf_cnpj: string;
  cd_nie: string;
  de_pais_ne: string;
  vl_fonte_renda_medio: number;
  de_nome_mae: string;
  de_pais_nascimento: string;
  dt_nasc_const: string;
  de_cidade_nascimento: string;
  de_endereco: string;
  de_cidade: string;
  de_uf: string;
  de_pais: string;
  cd_fone: string;
  cd_atividade: string;
  cd_ocupacao: string;
  de_forma_constituicao: string;
  dt_atualizacao_cadastral: string;
  fl_pep: number;
  fl_filiais_exterior: number;
  qt_funcionarios: number;
  dt_inicio_relacionamento: string;
  dt_fim_relacionamento: string;
  cd_cep: string;
  ip_eletronico: string;
  email: string;
  fl_relacionamento_terceiros: number;
  fl_admin_cartoes: number;
  fl_empresa_trust: number;
  fl_facilitadora_pagto: number;
  cd_nat_juridica: string;
  fl_emp_regulada: number;
}

export class EguardianCreateReportPaymentsAccountHolderGateway
  implements Pick<ReportGateway, 'createReportPaymentsAccountHolder'>
{
  constructor(private readonly logger: Logger) {
    this.logger = logger.child({
      context: EguardianCreateReportPaymentsAccountHolderGateway.name,
    });
  }

  async createReportPaymentsAccountHolder(
    request: CreateReportPaymentsAccountHolderPspRequest,
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

  private formatReport(
    report: ReportUser,
  ): IEguardianReportPaymentsAccountHolderFile {
    // Is necessary format de fields before send (like sanitize the length). Here we are just pick them.
    const userType = report.user.type;

    return {
      cd_titular: report.user.uuid.slice(0, 20),
      cd_tp_titular:
        userType === PersonType.LEGAL_PERSON
          ? EguardianPersonType.J
          : EguardianPersonType.F,
      ds_grupo_titular:
        userType === PersonType.LEGAL_PERSON
          ? ReportPaymentAccountHolderGroupType.PJ
          : ReportPaymentAccountHolderGroupType.PF,
      cd_tp_papel: '01',
      de_titular:
        report.user.fullName &&
        Sanitize.removeAccentuation(report.user.fullName),
      cd_cpf_cnpj: Sanitize.removeSpecialCharacters(report.user.document),
      cd_nie: null,
      de_pais_ne: null,
      vl_fonte_renda_medio: null,
      de_nome_mae:
        userType === PersonType.LEGAL_PERSON ? null : report.user.motherName,
      de_pais_nascimento:
        userType === PersonType.LEGAL_PERSON
          ? null
          : Sanitize.removeAccentuation(report.address.country),
      dt_nasc_const: getMoment(report.user.birthDate).format(DATE_FORMAT),
      de_cidade_nascimento:
        report.address.city && Sanitize.removeAccentuation(report.address.city),
      de_endereco: Sanitize.removeAccentuation(
        `${report.address.street} ${report.address.number} ${report.address.complement}`,
      ),
      de_cidade:
        report.address.city && Sanitize.removeAccentuation(report.address.city),
      de_uf:
        report.address.federativeUnit &&
        Sanitize.removeAccentuation(report.address.federativeUnit),
      de_pais:
        report.address.country &&
        Sanitize.removeAccentuation(report.address.country),
      cd_fone:
        report.user.phoneNumber &&
        Sanitize.removeSpecialCharacters(report.user.phoneNumber),
      cd_atividade:
        userType === PersonType.LEGAL_PERSON
          ? report.userLegalAdditionalInfo.cnae
          : null,
      cd_ocupacao:
        userType === PersonType.NATURAL_PERSON ? report.occupation?.name : null,
      de_forma_constituicao: null,
      dt_atualizacao_cadastral: report.onboarding?.updatedAt
        ? getMoment(report.onboarding.updatedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      fl_pep: report.onboarding.pepSince ? 1 : 0,
      fl_filiais_exterior:
        report.userLegalAdditionalInfo?.overseasBranchesQty > 0 ? 1 : 0,
      qt_funcionarios: report.userLegalAdditionalInfo.employeeQty,
      dt_inicio_relacionamento: report.onboarding?.updatedAt
        ? getMoment(report.onboarding.updatedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      dt_fim_relacionamento: report.user.deletedAt
        ? getMoment(report.user.deletedAt).format(DATE_FORMAT)
        : DEFAULT_DATE,
      cd_cep:
        report.address.zipCode &&
        Sanitize.removeSpecialCharacters(report.address.zipCode),
      ip_eletronico: null,
      email: null,
      fl_relacionamento_terceiros: report.userLegalAdditionalInfo
        .isThirdPartyRelationship
        ? 1
        : 0,
      fl_admin_cartoes: report.userLegalAdditionalInfo.isCreditCardAdmin
        ? 1
        : 0,
      fl_empresa_trust: report.userLegalAdditionalInfo.isPatrimonyTrust ? 1 : 0,
      fl_facilitadora_pagto: report.userLegalAdditionalInfo.isPaymentFacilitator
        ? 1
        : 0,
      cd_nat_juridica: report.userLegalAdditionalInfo.legalNaturityCode,
      fl_emp_regulada: report.userLegalAdditionalInfo.isRegulatedPld ? 1 : 0,
    };
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }
}
