Feature: Jdpi payments mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def date = function(){ return new Date().toISOString() }
    * def randomNumber = function(min, max){ return Math.floor(Math.random() * (max - min) + min) }
    * def randomFloatNumber = function(min, max){ return (Math.random() * (max - min) + min).toFixed(2) }
    * def generateEndToEndId = function(){ return 'E' + Math.floor(10 ** 7 + Math.random() * 9 * 10 ** 7) +  '202310020000' + 'A' + Math.floor(10 ** 9 + Math.random() * 9 * 10 ** 9)}

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/op') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idReqSistemaCliente": "#(request.idReqSistemaCliente)",
        "idReqJdPi": "#(uuid())",
        "endToEndId": "#(generateEndToEndId())",
        "dtHrReqJdPi": "#(date())",
        "tpCanal": 0
      }
      """

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/od') && methodIs('post')
    * def responseStatus = 202
    * def response =
      """
      {
        "idReqSistemaCliente": "#(request.idReqSistemaCliente)",
        "idReqJdPi": "#(uuid())",
        "endToEndIdOriginal": "#(request.endToEndIdOriginal)",
        "endToEndIdDevolucao": "#(generateEndToEndId())",
        "dtHrReqJdPi": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/lancamento/{endToEndId}') && methodIs('get') && pathParams.endToEndId == 'E00038166201907261559y6j6mt9l0pi'
    * def responseStatus = 404
    * def response = {}
    * response.codigo = 'JDPISDV007'
    * response.mensagem = 'A Solicitação de Devolução não foi encontrada.'

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/lancamento/{endToEndId}') && methodIs('get') && pathParams.endToEndId == '1ca308df6cdb0a8bf40d59be2a17eac1'
    * def responseStatus = 404
    * def response = {}
    * response.codigo = 'JDPISDV011'
    * response.mensagem = 'A situação da Solicitação de Devolução não permite a sua análise.'

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/lancamento/{endToEndId}') && methodIs('get') && pathParams.endToEndId == '12345'
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "#(pathParams.endToEndId)",
        "ispbPspDireto": 0,
        "tpLanc": 0,
        "stLanc": 1,
        "dtHrSituacao": "#(date())",
        "nomeMsgOrigem": "PACS.008",
        "tpIniciacao": 3,
        "prioridadePagamento": 0,
        "tpPrioridadePagamento": 0,
        "finalidade": 0,
        "valor": "#(parseFloat(randomFloatNumber(9,9999)))",
        "pagador": {
          "ispb": 0,
          "tpPessoa": 0,
          "cpfCnpj": 30954749030,
          "nome": "Maria Alice Pereira",
          "nrAgencia": "0001",
          "tpConta": 0,
          "nrConta": "33333333"
        },
        "recebedor": {
          "ispb": 0,
          "tpPessoa": 1,
          "cpfCnpj": 37827191000170,
          "nrAgencia": "4321",
          "tpConta": 0,
          "nrConta": "87654321"
        },
        "dtContabil": "2023-08-21",
        "chave": "#(uuid())",
        "idConciliacaoRecebedor": "JDPI2020010300000000000000000000001",
        "infEntreClientes": "campo livre para descricao",
        "codigoErro": "AB03",
        "detalheCodigoErro": "test"
      }
      """

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/lancamento/{endToEndId}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "#(pathParams.endToEndId)",
        "ispbPspDireto": 0,
        "tpLanc": 0,
        "stLanc": 0,
        "dtHrSituacao": "#(date())",
        "nomeMsgOrigem": "PACS.008",
        "tpIniciacao": 3,
        "prioridadePagamento": 0,
        "tpPrioridadePagamento": 0,
        "finalidade": 0,
        "valor": "#(parseFloat(randomFloatNumber(9,9999)))",
        "pagador": {
          "ispb": 0,
          "tpPessoa": 0,
          "cpfCnpj": 30954749030,
          "nome": "Maria Alice Pereira",
          "nrAgencia": "0001",
          "tpConta": 0,
          "nrConta": "33333333"
        },
        "recebedor": {
          "ispb": 0,
          "tpPessoa": 1,
          "cpfCnpj": 37827191000170,
          "nrAgencia": "4321",
          "tpConta": 0,
          "nrConta": "87654321"
        },
        "dtContabil": "2023-08-21",
        "chave": "#(uuid())",
        "idConciliacaoRecebedor": "JDPI2020010300000000000000000000001",
        "infEntreClientes": "campo livre para descricao"
      }
      """

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/op/{idReqJdPiConsultada}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "idReqJdPiConsultada": "#(pathParams.idReqJdPiConsultada)",
        "dtHrReqJdPi": "#(date())",
        "dtHrSituacao": "#(date())",
        "stJdPi": 9,
        "stJdPiProc": 0,
        "endToEndId": "#(generateEndToEndId())",
        "dtHrEfetivacao": "#(date())",
        "tpIniciacao": 0,
        "pagador": {
          "ispb": 26264220,
          "tpPessoa": 1,
          "cpfCnpj": 26264220000116,
          "nome": "FACTA",
          "nrAgencia": "1",
          "tpConta": 0,
          "nrConta": "76543212"
        },
        "recebedor": {
          "ispb": "#(randomNumber(1000000,9999999))",
          "tpPessoa": 0,
          "cpfCnpj": 3548377025,
          "nome": "THIRD PART NAME",
          "nrAgencia": "#(randomNumber(100,9999))",
          "tpConta": 0,
          "nrConta": "#(randomNumber(1000000,9999999))"
        },
        "prioridadePagamento": 0,
        "tpPrioridadePagamento": 0,
        "finalidade": 0,
        "valor": "#(parseFloat(randomFloatNumber(9,9999)))",
        "vlrDetalhe": [],
        "infEntreClientes": "Pagamento para THIRD PART NAME (3548377025)"
      }
      """
