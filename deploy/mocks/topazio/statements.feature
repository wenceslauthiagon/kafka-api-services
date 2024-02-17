Feature: Topazio statements mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-transactions/bankstatements') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "bankstatement": [
          {
            "transactionId": "#(uuid())",
            "clientAccountNumber": "12345678",
            "clientBranch": "0001",
            "clientDocument": "12312312312",
            "clientIspb": "26264220",
            "clientKey": "12312312312",
            "clientName": "Arthur Rangel",
            "createdAt": "2022-04-28T03:01:05.844Z",
            "description": null,
            "isDevolution": false,
            "reason": null,
            "status": "LIQUIDADO",
            "transactionType": "CREDIT",
            "thirdPartAccountNumber": "11112222",
            "thirdPartAccountType": "CACC",
            "thirdPartBranch": "0001",
            "thirdPartDocument": "12332112332",
            "thirdPartIspb": "26264220",
            "thirdPartKey": null,
            "thirdPartName": "Francisco Carlos",
            "txId": null,
            "endToEndId": "E07679404202303211141kqGSODLG1Tr",
            "operation": "C",
            "transactionOriginalID": null,
            "amount": 13.99
          },
          {
            "transactionId": "#(uuid())",
            "clientAccountNumber": "12345678",
            "clientBranch": "0002",
            "clientDocument": "18274828311",
            "clientIspb": "26264220",
            "clientKey": "18274828311",
            "clientName": "Carlos Silva",
            "createdAt": "2022-04-28T03:01:05.844Z",
            "description": null,
            "isDevolution": false,
            "reason": null,
            "status": "LIQUIDADO",
            "transactionType": "CREDIT",
            "thirdPartAccountNumber": "93780372",
            "thirdPartAccountType": "CACC",
            "thirdPartBranch": "0001",
            "thirdPartDocument": "73829465823",
            "thirdPartIspb": "26264220",
            "thirdPartKey": null,
            "thirdPartName": "Paulo Martins",
            "txId": null,
            "endToEndId": "E45246410202303211409tzZyDgzfH8I",
            "operation": "C",
            "transactionOriginalID": null,
            "amount": 39.99
          },
          {
            "transactionId": "#(uuid())",
            "clientAccountNumber": "12345678",
            "clientBranch": "0002",
            "clientDocument": "81688771280",
            "clientIspb": "26264220",
            "clientKey": "81688771280",
            "clientName": "Lucas Silas",
            "createdAt": "2022-04-28T03:01:05.844Z",
            "description": null,
            "isDevolution": false,
            "reason": null,
            "status": "LIQUIDADO",
            "transactionType": "CREDIT",
            "thirdPartAccountNumber": "19284372",
            "thirdPartAccountType": "CACC",
            "thirdPartBranch": "0001",
            "thirdPartDocument": "14102415726",
            "thirdPartIspb": "26264220",
            "thirdPartKey": null,
            "thirdPartName": "Eduardo Souza",
            "txId": null,
            "endToEndId": null,
            "operation": "C",
            "transactionOriginalID": null,
            "amount": 31.02
          }
        ]
      }
      """
