Feature: Jdpi banks mock server

  Scenario: pathMatches('jdpi/auth/jdpi/spi/api/v1/gestao-psps/listar') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "resultado": [
          {
            "ispb": 4358798,
            "razaoSocial": "Banco JDConsultores",
            "nomeReduzido": "Banco JD",
            "tpPsp": 1,
            "modalidade": 1,
            "dtHrInicioPsp": "#(new Date().toISOString())",
            "stPsp": 1
          },
          {
            "ispb": 345678,
            "razaoSocial": "Banco Novo",
            "nomeReduzido": "New",
            "tpPsp": 2,
            "modalidade": 3,
            "dtHrInicioPsp": "#(new Date().toISOString())",
            "stPsp": 1
          }
        ]
      }
      """
