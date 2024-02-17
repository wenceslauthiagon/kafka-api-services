Feature: fcm mock server

  Scenario: pathMatches('/messages:send') && methodIs('post')
    * def response =
      """
        {
          "name": "projects/zro-bank/messages/0:111111111%000000000"
        }
      """
    * response.body = request.body
    * response.to = request.to
    * def responseStatus = 201
