Feature: Dock omnichannel mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('omnichannel/sms') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "body": {
          "mensagem": "Notificações encaminhadas para envio.",
          "protocolo": "#(uuid())"
        },
        "elapsed": "0:00:00.090214",
        "error": "",
        "message": "OK",
        "status": 200
      }
      """
