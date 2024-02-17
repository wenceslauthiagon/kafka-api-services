Feature: Jdpi statements mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def date = function(){ return new Date().toISOString() }


  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/conta-pi/extrato') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "X-Paginacao": {
          "totalRegistros": 1,
          "paginaAtual": 1,
          "tamanhoPagina": 100,
          "temPaginaAnterior": false,
          "temProximaPagina": false
        },
        "dtHrExtrato": "#(new Date().toISOString())",
        "resultado": [
          {
            "endToEndId": "E00038166201907261559y6j6mt9l0pi",
            "dtHrEfetivacao": "#(new Date().toISOString())",
            "dtContabil": "2020-01-23",
            "dtHrLiquidacao": "#(new Date().toISOString())",
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
              "cpfCnpj": 70305538000190,
              "nome": "Fulano Recebedor",
              "nrAgencia": "4321",
              "tpConta": 0,
              "nrConta": "87654321"
            },
            "tpOperacao": 0,
            "tpIniciacao": 3,
            "prioridadePagamento": 0,
            "tpPrioridadePagamento": 0,
            "finalidade": 0,
            "valor": 150.85,
            "chave": "#(uuid())",
            "idConciliacaoRecebedor": "JDPI2020010300000000000000000000001",
            "infEntreClientes": "campo livre",
            "devolucoes": [
              {
                "endToEndIdDevolucao": "D00038166201907261559y6j6mt9l7pi",
                "valorDevolucao": 50.1,
                "codigoDevolucao": "BE08",
                "dtHrEfetivacao": "#(new Date().toISOString())",
                "dtContabil": "2020-01-23"
              },
              {
                "endToEndIdDevolucao": "D00038166201907261559y6j6mt9l8pi",
                "valorDevolucao": 0.75,
                "codigoDevolucao": "MD06",
                "dtHrEfetivacao": "#(new Date().toISOString())",
                "dtContabil": "2020-01-23"
              }
            ]
          }
        ]
      }
      """

  Scenario: pathMatches('jdpi/spi-api/jdpi/spi/api/v2/credito-pagamento/validacao') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "E00038166201907261559y6j6mt9l0pi",
        "dtHrReqJdPi": "#(date())"
      }
      """