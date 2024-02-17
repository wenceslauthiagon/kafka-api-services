Feature: Dock accounts mock server

  Background:
    * def parseInteger = function(val){ return parseInt(val) }
    * def id = function(){ return Math.floor(Math.random() * (10000 - 1)) + 1; }

  Scenario: pathMatches('contas/{accountId}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(parseInteger(pathParams.accountId))",
        "idPessoa": 9897984,
        "nome": "Seiya de Pegaso",
        "idProduto": 1,
        "idOrigemComercial": 1,
        "nomeOrigemComercial": "SandBox",
        "idFantasiaBasica": 1,
        "nomeFantasiaBasica": "SandBox",
        "idStatusConta": 0,
        "statusConta": "Normal",
        "diaVencimento": 10,
        "melhorDiaCompra": 1,
        "dataStatusConta": "2019-02-17T22:55:00.000Z",
        "dataCadastro": "2019-02-17T22:55:00.000Z",
        "dataUltimaAlteracaoVencimento": null,
        "dataHoraUltimaCompra": null,
        "numeroAgencia": 1111,
        "numeroContaCorrente": "12345678",
        "valorRenda": 0,
        "formaEnvioFatura": "CORRESPONDÊNCIA",
        "titular": true,
        "limiteGlobal": 0,
        "limiteSaqueGlobal": 0,
        "saldoDisponivelGlobal": 4873.94,
        "saldoDisponivelSaque": 0,
        "impedidoFinanciamento": false,
        "diasAtraso": 0,
        "proximoVencimentoPadrao": "01/01/2079",
        "idProposta": 1124,
        "quantidadePagamentos": 0,
        "correspondencia": 1,
        "dataInicioAtraso": null,
        "rotativoPagaJuros": 0,
        "totalPosProx": 0,
        "saldoAtualFinal": 0,
        "saldoExtratoAnterior": 0,
        "aceitaNovaContaPorGrupoProduto": null,
        "funcaoAtiva": "CREDITO",
        "possuiOverLimit": false
      }
      """

  Scenario: pathMatches('contas/{accountId}/gerar-cartao-grafica') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "flagVirtual": 0,
        "idConta": "#(parseInteger(pathParams.accountId))",
        "idPessoa": "#(parseInteger(request.id_pessoa))",
        "idCartao": "#(id())",
        "idBandeira": 1,
        "idTipoCartao": 1,
        "dataGeracao": "2020-04-08T15:20:25.880Z",
        "dataValidade": "2030-04-30T00:00:00.000Z",
        "nomeOrigemComercial": "PORTADOR C/ SAQUE PF",
        "cpf": "03967703045"
      }
      """

  Scenario: pathMatches('contas/{accountId}/gerar-cartao-virtual') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idConta": "#(parseInteger(pathParams.accountId))",
        "idPessoa": 0,
        "idCartao": "#(id())",
        "idBandeira": 0,
        "idTipoCartao": 0,
        "numeroCartao": "4261000000007917",
        "nomePlastico": "NOME S IMPRESSO",
        "cvv2": "123",
        "dataGeracao": "2018-11-26T11:10:43.707Z",
        "dataValidade": "2030-12-31T00:00:00.000Z",
        "nomeOrigemComercial": "PORTADOR C/ SAQUE PF",
        "nomeEmpresa": "ZRO FAKER LTDA",
        "numeroAgencia": 1234,
        "numeroContaCorente": "12345678",
        "nomeEmpresaBeneficio": "ZRO FAKER LTDA",
        "cpf": "03967703045",
        "tipoPortador": "T",
        "nomeEmpregador": "ZRO FAKER LTDA",
        "flagVirtual": 1,
        "numeroCartaoHash": 4017395005806549500
      }
      """
    * response.dataValidade = paramValue('dataValidade')
