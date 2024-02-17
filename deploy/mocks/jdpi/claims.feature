Feature: Jdpi claims mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('jdpi/chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/incluir') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idReivindicacao": "#(uuid())",
        "stReivindicacao": 0,
        "dtHrLimiteResolucao": "#(new Date().toISOString())",
        "dtHrUltModificacao": "#(new Date().toISOString())"
      }
      """

  Scenario: pathMatches('jdpi/chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/listar/pendentes') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrJdPi": "#(new Date().toISOString())",
        "temMaisElementos": false,
        "reivindicacoesAssociadas": [
          {
            "tpReivindicacao": 0,
            "fluxoParticipacao": 1,
            "tpChave": 2,
            "chave": "fulano.portability.zro.donor@zro.com",
            "ispb": 68900810,
            "nrAgencia": "0001",
            "tpConta": 0,
            "nrConta": "0007654321",
            "dtHrAberturaConta": "#(new Date().toISOString())",
            "tpPessoa": 0,
            "cpfCnpj": 99307545049,
            "ispbDoador": 26264220,
            "idReivindicacao": "#(uuid())",
            "stReivindicacao": 0,
            "dtHrLimiteResolucao": "#(new Date().toISOString())",
            "dtHrLimiteConclusao": "#(new Date().toISOString())",
            "dtHrUltModificacao": "#(new Date().toISOString())"
          },
          {
            "tpReivindicacao": 0,
            "fluxoParticipacao": 0,
            "tpChave": 3,
            "chave": "+5561988887777",
            "ispb": 26264220,
            "nrAgencia": "0001",
            "tpConta": 0,
            "nrConta": "0007654322",
            "dtHrAberturaConta": "#(new Date().toISOString())",
            "tpPessoa": 1,
            "cpfCnpj": 4358798000107,
            "ispbDoador": 68900810,
            "dadosDoador": {
              "nrAgencia": "0001",
              "tpConta": 0,
              "nrConta": "0007654321",
              "tpPessoa": 1,
              "cpfCnpj": 4358798000107,
              "nome": "Fulano Tal",
              "nomeFantasia": "Portability claimant"
            },
            "idReivindicacao": "#(uuid())",
            "stReivindicacao": 3,
            "dtHrLimiteResolucao": "#(new Date().toISOString())",
            "dtHrLimiteConclusao": "#(new Date().toISOString())",
            "dtHrUltModificacao": "#(new Date().toISOString())"
          },
          {
            "tpReivindicacao": 1,
            "fluxoParticipacao": 1,
            "tpChave": 2,
            "chave": "fulano.ownership.zro.donor@zro.com",
            "ispb": 12345678,
            "nrAgencia": "0001",
            "tpConta": 0,
            "nrConta": "0007654321",
            "dtHrAberturaConta": "#(new Date().toISOString())",
            "tpPessoa": 0,
            "cpfCnpj": 99307545049,
            "ispbDoador": 26264220,
            "idReivindicacao": "#(uuid())",
            "stReivindicacao": 0,
            "dtHrLimiteResolucao": "#(new Date().toISOString())",
            "dtHrLimiteConclusao": "#(new Date().toISOString())",
            "dtHrUltModificacao": "#(new Date().toISOString())"
          },
          {
            "tpReivindicacao": 1,
            "fluxoParticipacao": 0,
            "tpChave": 2,
            "chave": "fulano.ownership.zro.claimant@zro.com",
            "ispb": 26264220,
            "nrAgencia": "0001",
            "tpConta": 0,
            "nrConta": "0007654322",
            "dtHrAberturaConta": "#(new Date().toISOString())",
            "tpPessoa": 0,
            "cpfCnpj": 99307545049,
            "ispbDoador": 4358798,
            "dadosDoador": {
              "nrAgencia": "0001",
              "tpConta": 0,
              "nrConta": "0007654321",
              "tpPessoa": 1,
              "cpfCnpj": 4358798000107,
              "nome": "Fulano Tal",
              "nomeFantasia": "Ownership claimant"
            },
            "idReivindicacao": "#(uuid())",
            "stReivindicacao": 0,
            "dtHrLimiteResolucao": "#(new Date().toISOString())",
            "dtHrLimiteConclusao": "#(new Date().toISOString())",
            "dtHrUltModificacao": "#(new Date().toISOString())"
          }
        ]
      }
      """

  Scenario: pathMatches('jdpi/chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/{id}/cancelar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idReivindicacao": "#(pathParams.id)",
        "stReivindicacao": 3,
        "dtHrLimiteResolucao": "#(new Date().toISOString())",
        "dtHrUltModificacao": "#(new Date().toISOString())"
      }
      """

  Scenario: pathMatches('jdpi/chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/{id}/confirmar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idReivindicacao": "#(pathParams.id)",
        "stReivindicacao": 2,
        "dtHrLimiteResolucao": "#(new Date().toISOString())",
        "dtHrUltModificacao": "#(new Date().toISOString())"
      }
      """

  Scenario: pathMatches('jdpi/chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/{id}/concluir') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idReivindicacao": "#(pathParams.id)",
        "stReivindicacao": 4,
        "dtHrLimiteResolucao": "#(new Date().toISOString())",
        "dtHrUltModificacao": "#(new Date().toISOString())"
      }
      """