Feature: Jdpi infractions mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def date = function(){ return new Date().toISOString() }

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/incluir') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrRetornoDict": "#(date())",
        "idCorrelacao": "#(uuid())",
        "idMarcacaoFraude": "#(uuid())",
        "stMarcacaoFraude": 0,
        "dtHrCriacaoMarcacaoFraude": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/listar') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrJdPi": "#(date())",
        "marcacoesInfracao": [
          {
            "idMarcacaoFraude": "#(uuid())",
            "tpPessoa": 0,
            "cpfCnpj": 47694792639,
            "chave": "#(uuid())",
            "tpFraude": 0,
            "stMarcacaoFraude": 0,
            "dtHrCriacaoMarcacaoFraude": "#(date())",
            "dtHrUltModificacao": "#(date())"
          },
          {
            "idMarcacaoFraude": "#(uuid())",
            "tpPessoa": 0,
            "cpfCnpj": 28758474730,
            "chave": "#(uuid())",
            "tpFraude": 0,
            "stMarcacaoFraude": 0,
            "dtHrCriacaoMarcacaoFraude": "#(date())",
            "dtHrUltModificacao": "#(date())"
          }
        ]
      }
      """

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/{idMarcacaoFraude}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrRetornoDict": "#(date())",
        "idCorrelacao": "#(uuid())",
        "idMarcacaoFraude": "#(pathParams.idMarcacaoFraude)",
        "tpPessoa": 0,
        "cpfCnpj": 55352527000,
        "chave": "#(uuid())",
        "tpFraude": 1,
        "stMarcacaoFraude": 0,
        "dtHrCriacaoMarcacaoFraude": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/{idMarcacaoFraude}/cancelar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrRetornoDict": "#(date())",
        "idCorrelacao": "#(uuid())",
        "idMarcacaoFraude": "#(pathParams.idMarcacaoFraude)",
        "stMarcacaoFraude": 1,
        "dtHrCriacaoMarcacaoFraude": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """