const { v4: uuidV4 } = require('uuid');

const bankBlockList = [
  { cnpj: '74014747000135', name: 'AGORA CTVM S.A.' },
  { cnpj: '62178421000164', name: 'ALFA CCVM S.A.' },
  { cnpj: '17312661000155', name: 'AMARIL FRANKLIN CTV LTDA' },
  {
    cnpj: '67600379000141',
    name: 'ANDBANK DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  { cnpj: '33775974000104', name: 'ATIVA INVESTIMENTOS S.A. C.T.C.V.' },
  {
    cnpj: '18684408000195',
    name: 'AZIMUT BRASIL DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  {
    cnpj: '40434681000110',
    name: 'AZUMI DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  { cnpj: '28195667000106', name: 'BANCO ABC BRASIL S/A' },
  { cnpj: '3532415000102', name: 'BANCO ABN AMRO S.A.' },
  { cnpj: '48795256000169', name: 'BANCO ANDBANK (BRASIL) S.A.' },
  { cnpj: '997185000150', name: 'BANCO B3 S.A.' },
  {
    cnpj: '556603000174',
    name: 'BANCO BARI DE INVESTIMENTOS E FINANCIAMENTOS S.A',
  },
  { cnpj: '1522368000182', name: 'BANCO BNP PARIBAS BRASIL S/A' },
  { cnpj: '15114366000169', name: 'BANCO BOCOM BBM S.A.' },
  { cnpj: '30306294000145', name: 'BANCO BTG PACTUAL S/A' },
  { cnpj: '33466988000138', name: 'BANCO CAIXA GERAL - BRASIL S/A' },
  { cnpj: '31597552000152', name: 'BANCO CLÁSSICO S.A.' },
  { cnpj: '2038232000164', name: 'BANCO COOPERATIVO SICOOB S.A' },
  { cnpj: '1181521000155', name: 'BANCO COOPERATIVO SICREDI S.A.' },
  { cnpj: '75647891000171', name: 'BANCO CREDIT AGRICOLE BRASIL S/A' },
  { cnpj: '32062580000138', name: 'BANCO CREDIT SUISSE (BRASIL) S.A.' },
  { cnpj: '62232889000190', name: 'BANCO DAYCOVAL S.A.' },
  {
    cnpj: '33987793000133',
    name: 'BANCO DE INVESTIMENTOS CREDIT SUISSE (BRASIL) S/A',
  },
  { cnpj: '4913711000108', name: 'BANCO DO ESTADO DO PARÁ S/A.' },
  { cnpj: '92702067000196', name: 'BANCO DO ESTADO DO RIO GRANDE DO SUL SA' },
  { cnpj: '7237373000120', name: 'BANCO DO NORDESTE DO BRASIL SA' },
  { cnpj: '33644196000106', name: 'BANCO FATOR S/A' },
  { cnpj: '58616418000108', name: 'BANCO FIBRA SA' },
  { cnpj: '11758741000152', name: 'BANCO FINAXIS S.A.' },
  { cnpj: '45246410000155', name: 'BANCO GENIAL S.A.' },
  { cnpj: '30723886000162', name: 'BANCO MODAL S.A.' },
  {
    cnpj: '33657248000189',
    name: 'BANCO NACIONAL DE DESENVOLVIMENTO ECONÔMICO E SOCIAL - BNDES',
  },
  { cnpj: '92894922000108', name: 'BANCO ORIGINAL S.A.' },
  { cnpj: '78632767000120', name: 'BANCO OURINVEST S.A.' },
  { cnpj: '61820817000109', name: 'BANCO PAULISTA S.A.' },
  { cnpj: '62144175000120', name: 'BANCO PINE S/A' },
  { cnpj: '61533584000155', name: 'BANCO SOCIETE GENERALE BRASIL S.A.' },
  { cnpj: '60889128000180', name: 'BANCO SOFISA SA' },
  { cnpj: '60518222000122', name: 'BANCO SUMITOMO MITSUI BRASILEIRO S.A.' },
  { cnpj: '61024352000171', name: 'BANCO VOITER S.A.' },
  { cnpj: '59588111000103', name: 'BANCO VOTORANTIM SA' },
  { cnpj: '10264663000177', name: 'BANCOSEGURO S.A.' },
  {
    cnpj: '28127603000178',
    name: 'BANESTES SA BANCO DO ESTADO DO ESPIRITO SANTO',
  },
  {
    cnpj: '62073200000121',
    name: 'BANK OF AMERICA MERRILL LYNCH BANCO MULTIPLO S.A.',
  },
  {
    cnpj: '93026847000126',
    name: 'BANRISUL S.A. CORRETORA DE VALORES MOBILIÁRIOS E CÂMBIO',
  },
  { cnpj: '24933830000130', name: 'BB BANCO DE INVESTIMENTO S.A.' },
  {
    cnpj: '33862244000132',
    name: 'BGC LIQUIDEZ DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  { cnpj: '42272526000170', name: 'BNY MELLON BANCO S.A.' },
  { cnpj: '15213150000150', name: 'BOCOM BBM CCVM S.A.' },
  { cnpj: '13220493000117', name: 'BR PARTNERS BANCO DE INVESTIMENTO S.A.' },
  { cnpj: '44077014000189', name: 'BR-CAPITAL DTVM S.A.' },
  { cnpj: '61855045000132', name: 'BRADESCO S/A CTVM' },
  { cnpj: '208000100', name: 'BRB BANCO DE BRASILIA SA' },
  { cnpj: '33850686000169', name: 'BRB DTVM SA' },
  {
    cnpj: '13486793000142',
    name: 'BRL TRUST DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  {
    cnpj: '28650236000192',
    name: 'BS2 DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  { cnpj: '43815158000122', name: 'BTG PACTUAL CTVM S/A' },
  {
    cnpj: '3384738000198',
    name: 'BV DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '32345784000186',
    name: 'C6 CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  { cnpj: '33868597000140', name: 'CITIBANK DTVM SA' },
  {
    cnpj: '33709114000164',
    name: 'CITIGROUP GLOBAL MARKETS BRASIL, CCTVM S/A',
  },
  { cnpj: '2685483000130', name: 'CM CAPITAL MARKETS CCTVM LTDA' },
  { cnpj: '2671743000119', name: 'CM CAPITAL MARKETS DTVM LTDA' },
  { cnpj: '9512542000118', name: 'CODEPE CORRETORA DE VALORES E CÂMBIO S.A.' },
  { cnpj: '336036000140', name: 'COINVALORES CCVM LTDA' },
  { cnpj: '92858380000118', name: 'CORRETORA GERAL DE VALORES E CAMBIO LTDA' },
  { cnpj: '42584318000107', name: 'CREDIT SUISSE (BRASIL) S/A CTVM' },
  {
    cnpj: '61809182000130',
    name: 'CREDIT SUISSE HEDGING-GRIFFO CORRETORA DE VALORES S.A.',
  },
  { cnpj: '999999999999', name: 'CUSTODIANTE EXCLUSIVO DE TÍTULOS PÚBLICOS' },
  { cnpj: '62331228000111', name: 'DEUTSCHE BANK SA - BANCO ALEMAO' },
  { cnpj: '62280490000184', name: 'DIBRAN DTVM LTDA' },
  { cnpj: '28048783000100', name: 'ELITE CCVM LTDA' },
  { cnpj: '63062749000183', name: 'FATOR S.A. CORRETORA DE VALORES' },
  {
    cnpj: '37678915000160',
    name: 'FIDD DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
  },
  {
    cnpj: '36266751000100',
    name: 'FINVEST DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  {
    cnpj: '13673855000125',
    name: 'FRAM CAPITAL DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  {
    cnpj: '5816451000115',
    name: 'GENIAL INSTITUCIONAL CORRETORA DE CAMBIO, TITULOS E VALORES MOBILIARIOS S.A.',
  },
  {
    cnpj: '27652684000162',
    name: 'GENIAL INVESTIMENTOS CORRETORA DE VALORES MOBILIÁRIOS S.A.',
  },
  { cnpj: '9605581000160', name: 'GOLDMAN SACHS DO BRASIL CTVM S/A' },
  {
    cnpj: '65913436000117',
    name: 'GUIDE INVESTIMENTOS S.A. CORRETORA DE VALORES',
  },
  {
    cnpj: '1788147000150',
    name: 'H.COMMCOR DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  {
    cnpj: '34111187000112',
    name: 'HAITONG BANCO DE INVESTIMENTO DO BRASIL S.A.',
  },
  {
    cnpj: '33894445000111',
    name: 'HAITONG SECURITIES DO BRASIL CORRETORA DE CÂMBIO E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '37800856000151',
    name: 'HARMONIA DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '7253654000176',
    name: 'HEDGE INVESTMENTS DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  {
    cnpj: '39669186000101',
    name: 'HEMERA DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA',
  },
  { cnpj: '9105360000122', name: 'ICAP DO BRASIL CTVM LTDA' },
  {
    cnpj: '16695922000109',
    name: 'ID CORRETORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  {
    cnpj: '31749596000150',
    name: 'IDEAL CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '329598000167',
    name: 'INDIGO INVESTIMENTOS DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
  },
  {
    cnpj: '18945670000146',
    name: 'INTER DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS',
  },
  { cnpj: '15489568000195', name: 'INTRA INVESTIMENTOS DTVM LTDA' },
  { cnpj: '61194353000164', name: 'ITAÚ CORRETORA DE VALORES S.A.' },
  { cnpj: '33311713000125', name: 'ITAÚ DTVM S.A.' },
  { cnpj: '33851205000130', name: 'J P MORGAN S/A DTVM' },
  { cnpj: '32588139000194', name: 'J. P. MORGAN CCVM S.A.' },
  { cnpj: '71590442000183', name: 'LASTRO RDV DTVM LTDA' },
  {
    cnpj: '45457891000148',
    name: 'LEV DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA',
  },
  { cnpj: '7138049000154', name: 'LIGA INVEST DTVM LTDA.' },
  {
    cnpj: '24361690000172',
    name: 'LIMINE TRUST DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
  },
  {
    cnpj: '40768766000135',
    name: 'LIONS TRUST DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  {
    cnpj: '36864992000142',
    name: 'MAF DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  {
    cnpj: '33886862000112',
    name: 'MASTER S/A CORRETORA DE CAMBIO, TITULOS E VALORES MOBILIARIOS',
  },
  { cnpj: '16683062000185', name: 'MERCANTIL DO BRASIL CORRETORA S/A CTVM' },
  {
    cnpj: '41592532000142',
    name: 'MERITO DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
  },
  {
    cnpj: '2670590000195',
    name: 'MERRILL LYNCH S/A CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS',
  },
  {
    cnpj: '12392983000138',
    name: 'MIRAE ASSET WEALTH MANAGEMENT (BRAZIL) CCTVM LTDA',
  },
  { cnpj: '5389174000101', name: 'MODAL D.T.V.M. LTDA' },
  { cnpj: '4323351000194', name: 'MORGAN STANLEY CTVM S.A.' },
  {
    cnpj: '61723847000199',
    name: 'NEON CORRETORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  { cnpj: '4257795000179', name: 'NOVA FUTURA CTVM LTDA' },
  {
    cnpj: '43060029000171',
    name: 'NOVINVEST CORRETORA DE VALORES MOBILIÁRIOS LTDA.',
  },
  { cnpj: '62169875000179', name: 'NU INVEST CORRETORA DE VALORES S.A.' },
  { cnpj: '36113876000191', name: 'OLIVEIRA TRUST DTVM S.A.' },
  {
    cnpj: '13293225000125',
    name: 'ÓRAMA DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '997804000107',
    name: 'OURINVEST DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  { cnpj: '92236777000178', name: 'PINE INVESTIMENTOS DTVM LTDA' },
  { cnpj: '806535000154', name: 'PLANNER CORRETORA DE VALORES SA' },
  {
    cnpj: '89960090000176',
    name: 'RB INVESTIMENTOS DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  {
    cnpj: '34829992000186',
    name: 'REAG DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  { cnpj: '62287735000103', name: 'RENASCENCA DTVM LTDA' },
  {
    cnpj: '42066258000130',
    name: 'RJI CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
  },
  {
    cnpj: '62318407000119',
    name: 'S3 CACEIS BRASIL DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS S.A',
  },
  { cnpj: '60783503000102', name: 'SAFRA CORRETORA DE VALORES E CÂMBIO LTDA.' },
  {
    cnpj: '1638542000157',
    name: 'SAFRA WEALTH DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.',
  },
  { cnpj: '51014223000149', name: 'SANTANDER CCVM S/A' },
  {
    cnpj: '3502968000104',
    name: 'SANTANDER DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '39696805000157',
    name: 'SCOTIABANK BRASIL S.A. CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS',
  },
  {
    cnpj: '17352220000187',
    name: 'SENSO CORRETORA DE CÂMBIO E VALORES MOBILIÁRIOS S.A',
  },
  {
    cnpj: '68757681000170',
    name: 'SIM;PAUL CORRETORA DE CÂMBIO E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '62285390000140',
    name: 'SINGULARE CORRETORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  },
  { cnpj: '17315359000150', name: 'SITA SOCIEDADE CCVM S.A.' },
  {
    cnpj: '96477906000170',
    name: 'SOLIDEZ - CORRETORA DE CÂMBIO, TÍTULOS E VALORES MOBILIÁRIOS LIMITADA',
  },
  {
    cnpj: '62090873000190',
    name: 'STONEX DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
  },
  {
    cnpj: '3751794000113',
    name: 'TERRA INVESTIMENTOS DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA',
  },
  {
    cnpj: '29162769000198',
    name: 'TORO CORRETORA DE TÍTULOS E VALORES MOBILIARIOS S/A',
  },
  {
    cnpj: '2276653000123',
    name: 'TRINUS CAPITAL DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '67030395000146',
    name: 'TRUSTEE DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
  },
  {
    cnpj: '61747085000160',
    name: 'TULLETT PREBON BRASIL CORRETORA DE VALORES E CÂMBIO LTDA',
  },
  { cnpj: '18520834000193', name: 'UBS BRASIL BANCO DE INVESTIMENTO S.A.' },
  {
    cnpj: '2819125000173',
    name: 'UBS BRASIL CORRETORA DE CAMBIO, TITULOS E VALORES MOBILIARIOS S.A.',
  },
  { cnpj: '14388516000160', name: 'VIC DTVM S/A' },
  {
    cnpj: '34711571000156',
    name: 'VITREO DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
  },
  {
    cnpj: '22610500000188',
    name: 'VORTX DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
  },
  {
    cnpj: '92875780000131',
    name: 'WARREN CORRETORA DE VALORES MOBILIÁRIOS E CÂMBIO LTDA.',
  },
  { cnpj: '2332886000104', name: 'XP INVESTIMENTOS CCTVM S.A.' },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert(
        'warning_pix_deposit_bank_block_list',
        bankBlockList.map((bank) => ({
          ...bank,
          id: uuidV4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      await queryInterface.bulkDelete(
        'warning_pix_deposit_bank_block_list',
        { cnpj: { [Op.in]: bankBlockList.map(({ cnpj }) => cnpj) } },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
