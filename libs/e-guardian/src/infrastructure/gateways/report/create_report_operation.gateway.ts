import * as path from 'path';
import { Logger } from 'winston';
import { appendFile } from 'fs/promises';
import { Sanitize } from '@zro/e-guardian/utils/sanitize.util';
import {
  CreateReportOperationPspRequest,
  ReportGateway,
} from '@zro/reports/application';
import { ReportExport, ReportOperation } from '@zro/reports/domain';
import { CreateReportGatewayException } from '@zro/e-guardian/infrastructure';
import { getMoment } from '@zro/common';

const DATE_FORMAT = 'YYYYMMDD';
enum OperationType {
  CREDIT = 'C',
  DEBIT = 'D',
}
interface IEguardianReportOperationFile {
  cd_identificacao: string;
  cd_veic_legal: number;
  cd_agencia: string;
  cd_agencia_movto: string;
  cd_conta: string;
  cd_cliente: string;
  dt_movimenta: string;
  dthr_movimenta: string;
  cd_moeda: string;
  vl_operacao: number;
  tp_deb_cred: OperationType;
  cd_forma: string;
  de_contraparte: string;
  de_banco_contra: string;
  de_agencia_contra: string;
  de_conta_contra: string;
  cd_pais_contra: string;
  de_origem_ope: string;
  cd_produto: string;
  de_finalidade: string;
  cpf_cnpj_contra: string;
  ds_cidade_contra: string;
  ds_comp_historico: string;
  vl_rendimento: string;
  dt_prev_liquidificacao: string;
  cd_ispb_emissor: number;
  nr_cheque: string;
  de_tp_docto_contra: string;
  nr_docto_contra: string;
  de_executor: string;
  cpf_executor: string;
  nr_passaporte_exec: string;
  fl_iof_carencia: number;
  cd_nat_operacao: string;
  de_ordenante: string;
  uf_movto: string;
  nr_pos: string;
  ds_cidade_pos: string;
  ds_canal: string;
  ds_origem_recurso: string;
  ds_destino_recurso: string;
  cd_provisionamento: string;
  ds_ambiente_neg: string;
}

export class EguardianCreateReportOperationGateway
  implements Pick<ReportGateway, 'createReportOperation'>
{
  constructor(private readonly logger: Logger) {
    this.logger = logger.child({
      context: EguardianCreateReportOperationGateway.name,
    });
  }

  async createReportOperation(
    request: CreateReportOperationPspRequest,
  ): Promise<void> {
    try {
      const report = this.formatReport(request.reportOperation);

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
    reportOperation: ReportOperation,
  ): IEguardianReportOperationFile {
    // It is necessary to format the fields before sending (like sanitize the length). Here we just pick them.

    return {
      cd_identificacao:
        reportOperation.id && Sanitize.sliceSting(reportOperation.id, 0, 40),
      cd_veic_legal:
        reportOperation.clientBankCode &&
        Number(reportOperation.clientBankCode),
      cd_agencia:
        reportOperation.clientBranch &&
        Sanitize.sliceSting(reportOperation.clientBranch, 0, 10),
      cd_agencia_movto:
        reportOperation.clientBranch &&
        Sanitize.sliceSting(reportOperation.clientBranch, 0, 10),
      cd_conta:
        reportOperation.clientAccountNumber &&
        Sanitize.sliceSting(reportOperation.clientAccountNumber, 0, 20),
      cd_cliente:
        reportOperation.client.id &&
        Sanitize.sliceSting(String(reportOperation.client.id), 0, 20),
      dt_movimenta: getMoment(reportOperation.operation.createdAt).format(
        DATE_FORMAT,
      ),
      dthr_movimenta: null,
      cd_moeda: null,
      vl_operacao:
        reportOperation.operation.value && reportOperation.operation.value,
      tp_deb_cred:
        reportOperation.operationType === 'C'
          ? OperationType.CREDIT
          : OperationType.DEBIT,
      cd_forma:
        reportOperation.transactionType.title &&
        Sanitize.removeAccentuation(
          Sanitize.sliceSting(reportOperation.transactionType.title, 0, 20),
        ),
      de_contraparte:
        reportOperation.thirdPart?.fullName &&
        Sanitize.sliceSting(
          Sanitize.removeAccentuation(reportOperation.thirdPart.fullName),
          0,
          120,
        ),
      de_banco_contra:
        reportOperation.thirdPartBankCode &&
        Sanitize.sliceSting(reportOperation.thirdPartBankCode, 0, 60),
      de_agencia_contra:
        reportOperation.thirdPartBankCode &&
        Sanitize.sliceSting(reportOperation.thirdPartBankCode, 0, 60),
      de_conta_contra:
        reportOperation.thirdPartAccountNumber &&
        Sanitize.sliceSting(reportOperation.thirdPartAccountNumber, 0, 15),
      cd_pais_contra: 'BR',
      de_origem_ope: null,
      cd_produto:
        reportOperation.transactionType.id &&
        Sanitize.sliceSting(String(reportOperation.transactionType.id), 0, 20),
      de_finalidade: '',
      cpf_cnpj_contra:
        reportOperation.thirdPart?.document &&
        Sanitize.removeSpecialCharacters(reportOperation.thirdPart.document),
      ds_cidade_contra:
        reportOperation.thirdPart?.state &&
        Sanitize.removeSpecialCharacters(reportOperation.thirdPart.state),
      ds_comp_historico: null,
      vl_rendimento: null,
      dt_prev_liquidificacao: getMoment(
        reportOperation.operation.createdAt,
      ).format(DATE_FORMAT),
      cd_ispb_emissor: -1,
      nr_cheque: null,
      de_tp_docto_contra: null,
      nr_docto_contra: null,
      de_executor: null,
      cpf_executor: null,
      nr_passaporte_exec: null,
      fl_iof_carencia: null,
      cd_nat_operacao: null,
      de_ordenante: null,
      uf_movto: null,
      nr_pos: null,
      ds_cidade_pos: null,
      ds_canal: null,
      ds_origem_recurso: null,
      ds_destino_recurso: null,
      cd_provisionamento: null,
      ds_ambiente_neg: null,
    };
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }
}
