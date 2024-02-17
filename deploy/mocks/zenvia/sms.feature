Feature: Stateful zenvia mock server

  Scenario: pathMatches('/services/send-sms') && methodIs('post') && request.sendSmsRequest.to == '5581987654321'
    * def response =
      """
      {
        "sendSmsResponse": {
          "statusCode": "05",
          "statusDescription": "Blocked",
          "detailCode": "140",
          "detailDescription": "Mobile number not covered"
        }
      }
      """
    * def responseStatus = 500

  Scenario: pathMatches('/services/send-sms') && methodIs('post')
    * def response =
      """
      {
        "sendSmsResponse": {
          "statusCode": "00",
          "statusDescription": "Ok",
          "detailCode": "000",
          "detailDescription": "Message Sent"
        }
      }
      """
    * def responseStatus = 200
