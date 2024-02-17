Feature: Jdpi infractions mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def generateEndToEndId = function(){ return 'E' + Math.floor(10 ** 7 + Math.random() * 9 * 10 ** 7) +  '202310020000' + 'A' + Math.floor(10 ** 9 + Math.random() * 9 * 10 ** 9)}
    * def date = function(){ return new Date().toISOString() }

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/incluir') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "idRelatoInfracao": "#(uuid())",
        "stRelatoInfracao": 0,
        "pspCriador": "#(randomNumber(1000000,9999999))",
        "pspContraParte": 26264220,
        "dtHrCriacaoRelatoInfracao": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/cancelar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "#(generateEndToEndId())",
        "idRelatoInfracao": "#(uuid())",
        "stRelatoInfracao": 2,
        "dtHrCriacaoRelatoInfracao": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/analisar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "#(generateEndToEndId())",
        "idRelatoInfracao": "#(uuid())",
        "stRelatoInfracao": 3,
        "dtHrCriacaoRelatoInfracao": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/listar') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrJdPi": "#(date())",
        "reporteInfracao": [
          {
            "endToEndId": "#(generateEndToEndId())",
            "motivo": 1,
            "tpSitOrigem": 0,
            "detalhes": "Transação feita através de QR Code falso em boleto",
            "idRelatoInfracao": "#(uuid())",
            "stRelatoInfracao": 0,
            "pspCriador": "#(randomNumber(1000000,9999999))",
            "pspContraParte": 26264220,
            "dtHrCriacaoRelatoInfracao": "#(date())",
            "dtHrUltModificacao": "#(date())"
          },
          {
            "endToEndId": "#(generateEndToEndId())",
            "motivo": 1,
            "tpSitOrigem": 1,
            "detalhes": "Transação feita através de celular furtado",
            "idRelatoInfracao": "#(uuid())",
            "stRelatoInfracao": 3,
            "pspCriador": "#(randomNumber(1000000,9999999))",
            "pspContraParte": 26264220,
            "dtHrCriacaoRelatoInfracao": "#(date())",
            "dtHrUltModificacao": "#(date())",
            "idMarcacaoFraude": "#(uuid())",
            "resultadoAnalise": 0,
            "detalhesAnalise": "O valor da transação será estornado em até 5 dias úteis"
          }
        ]
      }
      """
