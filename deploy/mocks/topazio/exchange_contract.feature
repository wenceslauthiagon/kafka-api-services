Feature: Topazio exchange quotation mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID().toString() }
    * def randFloat = function(){ return Math.floor(Math.random() * (5.0 - 4.0)) + 4.0 }

  Scenario: pathMatches('exchange-contract/v1/contract') && methodIs('post')
    * def responseStatus = 201
    * def response =
      """
      {
        "resultSet": {
          "id": "TRD_1040",
          "tradeIds": [
            "#(uuid())",
            "#(uuid())"
          ],
          "externalName": "Teste",
          "externalIban": "Teste",
          "intermBankSwift": "Teste",
          "intermBankCity": "Teste",
          "intermBankName": "Teste",
          "intermBankAba": "Teste",
          "receiverBankAba": "teste",
          "receiverBankName": "teste",
          "externalAddress": "Teste",
          "nature": 121860900590,
          "country": 2496,
          "receiverBankSwift": "Teste",
          "receiverBankCity": "Teste",
          "externalSettlementDate": "#(new Date().toISOString())",
          "internalSettlementDate": "#(new Date().toISOString())",
          "fxRate": 4.8104,
          "internalValue": 43100.56,
          "externalValue": 8959.87,
          "iofValue": 163.782128,
          "clientReference": "Teste",
          "createdDate": "#(new Date().toISOString())",
          "status": "I"
        }
      }
      """

  Scenario: pathMatches('exchange-contract/v1/contract') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "resultSet": [
          {
            "id": "TRD_1040",
            "tradeIds": [
              "#(uuid())",
              "#(uuid())"
            ],
            "externalName": "Teste",
            "externalIban": "Teste",
            "intermBankSwift": "Teste",
            "intermBankCity": "Teste",
            "intermBankName": "Teste",
            "intermBankAba": "Teste",
            "receiverBankAba": "teste",
            "receiverBankName": "teste",
            "externalAddress": "Teste",
            "nature": 121860900590,
            "country": 2496,
            "receiverBankSwift": "Teste",
            "receiverBankCity": "Teste",
            "externalSettlementDate": "#(new Date().toISOString())",
            "internalSettlementDate": "#(new Date().toISOString())",
            "fxRate": 4.8104,
            "internalValue": 43100.56,
            "externalValue": 8959.87,
            "iofValue": 163.782128,
            "clientReference": "Teste",
            "createdDate": "#(new Date().toISOString())",
            "status": "I"
          },
          {
            "id": "TRD_1040",
            "tradeIds": [
              "#(uuid())",
              "#(uuid())"
            ],
            "externalName": "Teste",
            "externalIban": "Teste",
            "intermBankSwift": "Teste",
            "intermBankCity": "Teste",
            "intermBankName": "Teste",
            "intermBankAba": "Teste",
            "receiverBankAba": "teste",
            "receiverBankName": "teste",
            "externalAddress": "Teste",
            "nature": 121860900590,
            "country": 2496,
            "receiverBankSwift": "Teste",
            "receiverBankCity": "Teste",
            "externalSettlementDate": "#(new Date().toISOString())",
            "internalSettlementDate": "#(new Date().toISOString())",
            "fxRate": 4.8104,
            "internalValue": 43100.56,
            "externalValue": 8959.87,
            "iofValue": 163.782128,
            "clientReference": "Teste",
            "createdDate": "#(new Date().toISOString())",
            "status": "I"
          }
        ],
        "page": "3",
        "perPage": "2",
        "totalRegisters": 6,
        "totalPages": 3
      }
      """

  Scenario: pathMatches('exchange-contract/v1/contract/{id}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "resultSet": [
          {
            "id": "TRD_1040",
            "tradeIds": [
              "#(uuid())",
              "#(uuid())"
            ],
            "externalName": "Teste",
            "externalIban": "Teste",
            "intermBankSwift": "Teste",
            "intermBankCity": "Teste",
            "intermBankName": "Teste",
            "intermBankAba": "Teste",
            "receiverBankAba": "teste",
            "receiverBankName": "teste",
            "externalAddress": "Teste",
            "nature": 121860900590,
            "country": 2496,
            "receiverBankSwift": "Teste",
            "receiverBankCity": "Teste",
            "externalSettlementDate": "#(new Date().toISOString())",
            "internalSettlementDate": "#(new Date().toISOString())",
            "fxRate": 4.8104,
            "internalValue": 43100.56,
            "externalValue": 8959.87,
            "iofValue": 163.782128,
            "clientReference": "Teste",
            "createdDate": "#(new Date().toISOString())",
            "status": "I"
          }
        ],
        "page": "3",
        "perPage": "2",
        "totalRegisters": 6,
        "totalPages": 3
      }
      """
