Feature: Jdpi keys mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def generateEndToEndId = function(){ return 'E' + Math.floor(10 ** 7 + Math.random() * 9 * 10 ** 7) +  '202310020000' + 'A' + Math.floor(10 ** 9 + Math.random() * 9 * 10 ** 9)}

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 3 && request.chave == '+5581976543210'
    * def responseStatus = 400
    * def response = {}
    * response.codigo = 'EntryKeyOwnedByDifferentPerson'
    * response.mensagem = 'Já existe vínculo para essa chave mas ela é possuída por outra pessoa. Indica-se que seja feita uma reivindicação de posse.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 2 && request.chave == 'owner@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.codigo = 'EntryKeyInCustodyOfDifferentParticipant'
    * response.mensagem = 'Já existe vínculo para essa chave com o mesmo dono, mas ela encontra-se associada a outro participante. Indica-se que seja feita uma reivindicação de portabilidade.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 2 && request.chave == 'claim@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.codigo = 'EntryLockedByClaim'
    * response.mensagem = 'Existe uma reivindicação com status diferente de concluída ou cancelada para a chave do vínculo. Enquanto estiver nessa situação, o vínculo não pode ser excluído.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 2 && request.chave == 'limit@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.codigo = 'EntryLimitExceeded'
    * response.mensagem = 'Número de vínculos associados a conta transacional excedeu o limite máximo.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 2 && request.chave == 'keyexists@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.codigo = 'EntryAlreadyExists'
    * response.mensagem = 'Já existe vínculo para essa chave com o mesmo participante e dono.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 2 && request.chave == 'invalidtype@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.codigo = 'EntryInvalid'
    * response.mensagem = 'Existem campos inválidos ao tentar criar novo vínculo.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post') && request.tpChave == 4
    * def responseStatus = 200
    * def response =
      """
      {
        "chave": "#(uuid())",
        "dtHrCriacaoChave": "#(new Date().toISOString())",
        "dtHrInicioPosseChave": "#(new Date().toISOString())"
      }
      """

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/incluir') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "chave": "#(request.chave)",
        "dtHrCriacaoChave": "#(new Date().toISOString())",
        "dtHrInicioPosseChave": "#(new Date().toISOString())"
      }
      """

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/{chave}/excluir') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.chave = pathParams.chave

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/{chave}') && methodIs('get') && pathParams.chave == 'f6e2e084-29b9-4935-a059-5473b13033aa'
    * def responseStatus = 404
    * def response = {}
    * response.codigo = 'NotFound'
    * response.mensagem = 'Chave de Endereçamento não encontrada.'

  Scenario: pathMatches('jdpi/chave-gestao-api/jdpi/dict/api/v2/{chave}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "tpChave": 2,
        "chave": "#(pathParams.chave)",
        "ispb": 4358798,
        "nrAgencia": "0001",
        "tpConta": 0,
        "nrConta": "0007654321",
        "dtHrAberturaConta": "#(new Date().toISOString())",
        "tpPessoa": 1,
        "cpfCnpj": 4358798000107,
        "nome": "Fulano de Tal",
        "nomeFantasia": "Empresa Recebedora",
        "dtHrCriacaoChave": "#(new Date().toISOString())",
        "dtHrInicioPosseChave": "#(new Date().toISOString())",
        "dtHrAberturaReivindicacao": "#(new Date().toISOString())",
        "endToEndId": "#(generateEndToEndId())",
        "estatisticas": {
          "dtHrUltAtuAntiFraude": "#(new Date().toISOString())",
          "contadores": [
            {
              "tipo": 1,
              "agregado": 0,
              "d3": 1,
              "d30": 25,
              "m6": 150
            },
            {
              "tipo": 1,
              "agregado": 1,
              "d3": 0,
              "d30": 15,
              "m6": 100
            }
          ]
        }
      }
      """
