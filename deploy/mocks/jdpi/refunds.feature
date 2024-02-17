Feature: Jdpi payments mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def date = function(){ return new Date().toISOString() }
    * def randomNumber = function(min, max){ return Math.floor(Math.random() * (max - min) + min) }
    * def randomFloatNumber = function(min, max){ return (Math.random() * (max - min) + min).toFixed(2) }
    * def generateEndToEndId = function(){ return 'E' + Math.floor(10 ** 7 + Math.random() * 9 * 10 ** 7) +  '202310020000' + 'A' + Math.floor(10 ** 9 + Math.random() * 9 * 10 ** 9)}

  Scenario: pathMatches('jdpi/chave-devolucao-api/jdpi/dict/api/v2/devolucao/analisar') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "dtHrRespostaDict": "#(date())",
        "idCorrelacaoDict": "#(generateEndToEndId())",
        "endToEndId": "#(generateEndToEndId())",
        "motivo": 1,
        "idSolDevolucao": "#(paramValue('idSolDevolucao'))",
        "idRelatoInfracao": "#(uuid())",
        "stSolDevolucao": 2,
        "ispbSolicitante": "#(randomNumber(1000000,9999999))",
        "ispbContestado": 26264220,
        "dtHrCriacaoSolDevolucao": "#(date())",
        "dtHrUltModificacao": "#(date())"
      }
      """

  Scenario: pathMatches('jdpi/chave-devolucao-api/jdpi/dict/api/v2/devolucao/listar') && methodIs('get')
    * def responseStatus = 202
    * def response =
      """
      {
        "dtHrJdPi": "#(date())",
        "solicitacoesDevolucao": [
          {
            "endToEndId": "#(generateEndToEndId())",
            "motivo": 1,
            "valorDevolucao": "#(parseFloat(randomFloatNumber(9,9999)))",
            "detalhes": "Houve fraude confirmada na transação.",
            "idSolDevolucao": "#(uuid())",
            "idRelatoInfracao": "#(uuid())",
            "stSolDevolucao": 0,
            "ispbSolicitante": "#(randomNumber(1000000,9999999))",
            "ispbContestado": 26264220,
            "dtHrCriacaoSolDevolucao": "#(date())",
            "dtHrUltModificacao": "#(date())"
          },
          {
            "endToEndId": "#(generateEndToEndId())",
            "motivo": 1,
            "valorDevolucao": "#(parseFloat(randomFloatNumber(9,9999)))",
            "detalhes": "Houve fraude confirmada na transação.",
            "idSolDevolucao": "#(uuid())",
            "idRelatoInfracao": "#(uuid())",
            "stSolDevolucao": 2,
            "ispbSolicitante": "#(randomNumber(10000000,99999999))",
            "ispbContestado": 26264220,
            "dtHrCriacaoSolDevolucao": "#(date())",
            "dtHrUltModificacao": "#(date())",
            "resultadoAnalise": 2,
            "detalhesAnalise": "Tentativa de devolução realizada, porém, sem saldo disponível",
            "motivoRejeicao": 0
          }
        ]
      }
      """
