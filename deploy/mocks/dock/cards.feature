Feature: Dock card mock server

  Background:
    * def parseInteger = function(val){ return parseInt(val) }
    * def id = function(){ return Math.floor(Math.random() * (10000 - 1)) + 1; }

  # activate_card
  Scenario: pathMatches('cartoes/{idCard}/desbloquear') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(parseInteger(pathParams.idCard))",
        "flagTitular": 0,
        "idPessoa": 0,
        "sequencialCartao": 1,
        "idConta": 0,
        "idStatus": 0,
        "dataStatus": "2019-03-20T09:47:00.000Z",
        "idEstagio": 0,
        "dataEstagio": "2019-03-20T05:44:00.000Z",
        "numeroBin": 426176,
        "numeroCartao": "4261********7917",
        "numeroCartaoHash": 4017395005806549500,
        "numeroCartaoCriptografado": "5D117DD07B897E0C03DFDA549F7F3090",
        "dataEmissao": "2018-11-26T11:10:43.707Z",
        "dataValidade": "2030-12-31T00:00:00.000Z",
        "cartaoVirtual": 0,
        "impressaoAvulsa": 0,
        "dataImpressao": "2018-11-26T11:10:43.707Z",
        "nomeArquivoImpressao": null,
        "idProduto": 0,
        "nomeImpresso": "NOME S IMPRESSO",
        "codigoDesbloqueio": "7917"
      }
      """

  # block_card
  Scenario: pathMatches('cartoes/{idCard}/bloquear') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(parseInteger(pathParams.idCard))",
        "flagTitular": 0,
        "idPessoa": 0,
        "sequencialCartao": 1,
        "idConta": 0,
        "idStatus": 2,
        "dataStatus": "2019-03-20T09:47:00.000Z",
        "idEstagio": 0,
        "dataEstagio": "2019-03-20T05:44:00.000Z",
        "numeroBin": 0426176,
        "numeroCartao": "4261********7917",
        "numeroCartaoHash": "5D117DD07B897E0C03DFDA549F7F3090",
        "numeroCartaoCriptografado": "5D117DD07B897E0C03DFDA549F7F3090",
        "dataEmissao": "2018-11-26T11:10:43.707Z",
        "dataValidade": "2030-12-31T00:00:00.000Z",
        "cartaoVirtual": 0,
        "impressaoAvulsa": 0,
        "dataImpressao": "2018-11-26T11:10:43.707Z",
        "nomeArquivoImpressao": null,
        "idProduto": 0,
        "nomeImpresso": "NOME S IMPRESSO",
        "codigoDesbloqueio": "7917"
      }
      """

  # cancel_card
  Scenario: pathMatches('cartoes/{idCard}/cancelar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(parseInteger(pathParams.idCard))",
        "flagTitular": 0,
        "idPessoa": 0,
        "sequencialCartao": 1,
        "idConta": 0,
        "idStatus": 10,
        "dataStatus": "2019-03-20T09:47:00.000Z",
        "idEstagio": 0,
        "dataEstagio": "2019-03-20T05:44:00.000Z",
        "numeroBin": 0426176,
        "numeroCartao": "4261********7917",
        "numeroCartaoHash": "5D117DD07B897E0C03DFDA549F7F3090",
        "numeroCartaoCriptografado": "5D117DD07B897E0C03DFDA549F7F3090",
        "dataEmissao": "2018-11-26T11:10:43.707Z",
        "dataValidade": "2030-12-31T00:00:00.000Z",
        "cartaoVirtual": 0,
        "impressaoAvulsa": 0,
        "dataImpressao": "2018-11-26T11:10:43.707Z",
        "nomeArquivoImpressao": null,
        "idProduto": 0,
        "nomeImpresso": "NOME S IMPRESSO",
        "codigoDesbloqueio": "7917"
      }
      """

  #card_new_via
  Scenario: pathMatches('cartoes/{idCard}/gerar-nova-via') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idConta": 141,
        "idPessoa": 16,
        "idCartao": 1,
        "idBandeira": 1,
        "idTipoCartao": 2,
        "numeroCartao": "5050750000253751",
        "nomePlastico": "SEIYA DE PEGASO",
        "cvv2": "344",
        "dataGeracao": "2020-04-08T16:13:05.058Z",
        "dataValidade": "2025-04-30T00:00:00.000Z",
        "nomeOrigemComercial": "test",
        "nomeEmpresa": null,
        "numeroAgencia": 0,
        "numeroContaCorente": "",
        "nomeEmpresaBeneficio": "",
        "cpf": "03967703045",
        "tipoPortador": "T",
        "nomeEmpregador": "",
        "trilha1": "test",
        "trilha2": "test",
        "trilhaCVV1": "test",
        "trilhaCVV2": "test",
        "flagVirtual": 0,
        "numeroCartaoHash": 2817910841501355500,
        "idImagem": null,
        "idMifare": null,
        "matriculaMifare": null
      }
      """

  # change_card_password
  Scenario: pathMatches('cartoes/{idCard}/alterar-senha') && methodIs('put')
    * def responseStatus = 200
    * def response =
      """
      {
        "headers": {},
        "body": "Operação executada com sucesso.",
        "statusCodeValue": 200,
        "statusCode": "OK"
      }
      """

  # change_card_status
  Scenario: pathMatches('cartoes/{idCard}/alterar-estagio') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(parseInteger(pathParams.idCard))",
        "flagTitular": 0,
        "idPessoa": 0,
        "sequencialCartao": 1,
        "idConta": 0,
        "idStatus": 0,
        "dataStatus": "2019-03-20T09:47:00.000Z",
        "idEstagio": 1,
        "dataEstagio": "2019-03-20T05:44:00.000Z",
        "numeroBin": 0426176,
        "numeroCartao": "4261********7917",
        "numeroCartaoHash": "5D117DD07B897E0C03DFDA549F7F3090",
        "numeroCartaoCriptografado": "5D117DD07B897E0C03DFDA549F7F3090",
        "dataEmissao": "2018-11-26T11:10:43.707Z",
        "dataValidade": "2030-12-31T00:00:00.000Z",
        "cartaoVirtual": 0,
        "impressaoAvulsa": 0,
        "dataImpressao": "2018-11-26T11:10:43.707Z",
        "nomeArquivoImpressao": null,
        "idProduto": 0,
        "nomeImpresso": "NOME S IMPRESSO",
        "codigoDesbloqueio": "7917"
      }
      """

  # check_card_password
  Scenario: pathMatches('cartoes/{idCard}/validar-senha') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "mensagem": "Ok! Senha válida.",
        "idStatusCartao": 1,
        "statusCartao": "Normal",
        "quantidadeTentativas": 0,
        "quantidadeMaximaTentativas": 3
      }
      """

  # create_card_password
  Scenario: pathMatches('cartoes/{idCard}/cadastrar-senha') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "message": "Success"
      }
      """

  # get_card_real_data
  Scenario: pathMatches('cartoes/{id}/consultar-dados-reais') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "flagVirtual": 1,
        "numeroCartao": "4261333300007917",
        "dataValidade": "2030-04-30T00:00:00.000Z",
        "cvv2": "123",
        "nomePlastico": "NOME S IMPRESSO",
        "idConta": 1,
        "idCartao": "#(parseInteger(pathParams.id))",
        "numeroAgencia": 1234,
        "numeroContaCorente": "12345678",
        "idStatusConta": 0,
        "statusConta": "ATIVA",
        "idStatusCartao": 1,
        "statusCartao": "ATIVA"
      }
      """

  # get_card
  Scenario: pathMatches('cartoes/{idCard}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(parseInteger(pathParams.idCard))",
        "flagTitular": 1,
        "idPessoa": 21,
        "sequencialCartao": 1,
        "idConta": 12,
        "idStatus": 1,
        "dataStatus": "2019-03-20T09:47:00.000Z",
        "idEstagio": 6,
        "dataEstagio": "2019-03-20T05:44:00.000Z",
        "numeroBin": 426176,
        "numeroCartao": "4261********7917",
        "numeroCartaoHash": 4017395005806549500,
        "numeroCartaoCriptografado": "5D117DD07B897E0C03DFDA549F7F3090",
        "dataEmissao": "2018-11-26T11:10:43.707Z",
        "dataValidade": "2030-12-31T00:00:00.000Z",
        "cartaoVirtual": 0,
        "impressaoAvulsa": null,
        "dataImpressao": null,
        "nomeArquivoImpressao": null,
        "idProduto": 1,
        "nomeImpresso": "NOME S IMPRESSO",
        "codigoDesbloqueio": "7917",
        "tipoPortador": "T",
        "idStatusCartao": 1,
        "dataStatusCartao": "2019-03-20T09:47:00.000Z",
        "idEstagioCartao": 6,
        "dataEstagioCartao": "2019-03-20T05:44:00.000Z",
        "dataGeracao": "2018-11-26T11:10:43.707Z",
        "flagVirtual": 0,
        "flagImpressaoOrigemComercial": null,
        "arquivoImpressao": "DOCK_1PF_111097",
        "descricaoTipoCartao": "SandBox",
        "tipoCartao": 2
      }
      """