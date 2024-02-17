Feature: JDPI qrcode mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    * def randQRCode = function(){ return java.util.Base64.getEncoder().encodeToString(uuid().getBytes()) }
    * def payloadJws = function(){ return "jwt_token_here"; }

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/decodificar') && methodIs('post') && request.qrCodePayload == 'decode_qr_code_dynamic'
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "E00038166201907261559y6j6mt9l0pi",
        "tpQRCode": 12,
        "dadosQrCodeDinamico": {
          "revisao": 0,
          "ispb": 10311218,
          "nrAgencia": "1234",
          "tpConta": 0,
          "nrConta": "0123456789",
          "chave": "fulano.tal@provedor.com.br",
          "codigoCategoria": "0000",
          "nomeRecebedor": "Fulano de Tal",
          "tpPessoaRecebedor": 0,
          "cpfCnpjRecebedor": 11111111111,
          "solicitacaoPagador": "Pesquisa de satisfação",
          "cnpjPagador": "4358798000107",
          "nomePagador": "Ciclano de Tal",
          "cidade": "Sao Paulo",
          "cep": "01227-200",
          "valorOriginal": 1000.01,
          "expiracaoQR": "86400",
          "dadosAdicionais": [
            {
              "nome": "Detalhes do Pagamento",
              "valor": "Informação Adicional do PSP do Recebedor"
            }
          ],
          "dtHrCriacao": "2020-01-20T12:29:15.043Z",
          "dtHrApresentacao": "2020-01-23T10:21:34.107Z",
          "urlPspRecebedor": "bx.com.br/JDPI/U0VHUkVET1RPVEFMTUVOVEVBTEVBVE9SSU8=",
          "reutilizavel": false,
          "status": 0,
          "idConciliacaoRecebedor": "#(uuid())"
        }
      }
      """

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/decodificar') && methodIs('post') && request.qrCodePayload == 'decode_qr_code_dynamic_due_date'
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "E00038166201907261559y6j6mt9l0pi",
        "tpQRCode": 13,
        "dadosQrCodeDinamicoCobv": {
          "revisao": 0,
          "ispb": 10311218,
          "nrAgencia": "1234",
          "tpConta": 0,
          "nrConta": "0123456789",
          "chave": "fulano.tal@provedor.com.br",
          "codigoCategoria": "0000",
          "tpPessoaRecebedor": 0,
          "cpfCnpjRecebedor": 11111111111,
          "nomeRecebedor": "Fulano de Tal",
          "logradouroRecebedor": "Rua Pix, 123",
          "cidade": "Sao Paulo",
          "uf": "SP",
          "cep": "01227-200",
          "solicitacaoPagador": "Pesquisa de satisfação",
          "cnpjPagador": "4358798000107",
          "nomePagador": "Ciclano de Tal",
          "valorOriginal": 1001.16,
          "abatimento": 1.11,
          "desconto": 0.04,
          "juros": 10.15,
          "multa": 200.22,
          "valorFinal": 1000.01,
          "dtVenc": "2021-06-17",
          "idConciliacaoRecebedor": "#(uuid())",
          "diasAposVenc": 365,
          "dadosAdicionais": [
            {
              "nome": "Detalhes do Pagamento",
              "valor": "Informação Adicional do PSP do Recebedor"
            }
          ],
          "dtHrCriacao": "2020-01-20T12:29:15.043Z",
          "dtHrApresentacao": "2020-01-23T10:21:34.107Z",
          "urlPspRecebedor": "bx.com.br/JDPI/U0VHUkVET1RPVEFMTUVOVEVBTEVBVE9SSU8=",
          "reutilizavel": false,
          "status": 0
        }
      }
      """

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/decodificar') && methodIs('post') && request.qrCodePayload == 'decode_qr_code_static'
    * def responseStatus = 200
    * def response =
      """
      {
        "endToEndId": "E00038166201907261559y6j6mt9l0pi",
        "tpQRCode": 11,
        "dadosQrCodeEstatico": {
          "ispb": 10311218,
          "nrAgencia": "1234",
          "tpConta": 0,
          "nrConta": "0123456789",
          "chave": "fulano.tal@provedor.com.br",
          "codigoCategoria": "0000",
          "valor": 1100.01,
          "nomeRecebedor": "Fulano de Tal",
          "tpPessoaRecebedor": 0,
          "cpfCnpjRecebedor": 11111111111,
          "cidade": "Sao Paulo",
          "cep": "01227-200",
          "idConciliacaoRecebedor": "#(uuid())"
        }
      }
      """

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/decodificar') && methodIs('post') && request.qrCodePayload == 'decode_qr_code_timeout'
    * def responseStatus = 408
    * def response =
      """
      {
        "codigo": "408",
        "erros": [
          {
            "campo": "Consulta Chave",
            "mensagens": [
              "Chave: 7ab0b028-4039-4c19-be54-62ac9f44f53b"
            ]
          }
        ],
        "mensagem": "Tempo de consulta excedido"
      }
      """

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/estatico/gerar') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.payloadBase64 = randQRCode();

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/dinamico/cobv/gerar') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.idDocumento = uuid();
    * response.payloadBase64 = randQRCode();

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/dinamico/gerar') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.idDocumento = uuid();
    * response.payloadBase64 = randQRCode();
    * response.payloadJws = payloadJws();

  Scenario: pathMatches('jdpi/qrcode-api/jdpi/qrcode/api/v1/dinamico/cobv/jws') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "payloadJws": "eyJhbGciOiJQUzUxMiIsImtpZCI6IjUwQTM5Qzc0MUE0RTFDQjQxN0Y2OEM2Q0MwMkY2M0JFODg2RDg1MzIiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJVS09jZEJwT0hMUVg5b3hzd0M5anZvaHRoVEkiLCJqa3UiOiJodHRwczovL2V4ZW1wbG8uY29tL3BpeC9qZHBpL3FyYy9qd2tzIn0.eyJ2ZXJzYW8iOiIxLjAuMCIsImRvY3VtZW50byI6eyJpZCI6IjNmOTk0YTY2LTgyMzAtNGM5YS1hZDJhLTBmZmU0YjY5YWQ2OCIsInJldmlzYW8iOjB9LCJjYWxlbmRhcmlvIjp7ImNyaWFjYW8iOiIxMy8xMC8yMDIwIDE4OjQ0OjExIiwiYXByZXNlbnRhY2FvIjoiMTMvMTAvMjAyMCAxODo0NDoxMSIsImV4cGlyYWNhbyI6IjIzLzEyLzIwMjAgMjM6NTk6MDUiLCJ2ZW5jaW1lbnRvIjoiMjMvMDEvMjAyMCAwMDowMDowMCIsInJlY2ViaXZlbEFwb3NWZW5jaW1lbnRvIjp0cnVlfSwicGFnYWRvciI6eyJjbnBqIjoiNDM1Odc5ODAwMDEwNyIsIm5vbWUiOiJDaWNsYW5vIGRlIFRhbCJ9LCJ2YwxvciI6eyJvcmlnaW5hbCI6MTAwMC4wMSwiZmluYWwiOjExMDAuMDEsImp1cm9zIjoxMDAuMCwibXVsdGEiOjEwLjAsImRlc2NvbnRvIjoxMC4wLCJwZXJtaXRlQWx0ZXJhY2FvIjpmYWxzZX0sImNoYXZlIjoiZnVsYW5vLnRhbEBwcm92ZWRvci5jb20uYnIiLCJ0eGlkIjoiSkRQSTIwMjAwMTAzMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEiLCJzb2xpY2l0YWNhb1BhZ2Fkb3IiOiJQZXNxdWlzYSBkZSBzYXRpc2Zhw6fDo28iLCJpbmZvQWRpY2lvbmFpcyI6W3sibm9tZSI6IkRldGFsaGVzIGRvIFBhZ2FtZW50byIsInZhbG9yIjoiSW5mb3JtYcOnw6NvIEFkaWNpb25hbCBkbyBQU1AgZG8gUmVjZWJlZG9yIn0seyJub21lIjoiRGV0YWxoZXMgZG8gUGFnYW1lbnRvIDIiLCJ2YwxvciI6IkluZm9ybWHDp8OjbyBBZGljaW9uYWwgZG8gUFNQIGRvIFJlY2ViZWRvciJ9XswiZXhwIjoxNjA4Nzc4NzQ1LCJuYmYiOjE2MDI2MTQ2NTYsImlhdCI6MTYwMjYxNDY1Nn0.Ml-RauOQlIqPxRf4sjnoMuJRzbFLcEaF4KQmP5Hm9ilCht89kXQCiGdNHQZ3cU0_Civf2zQsNwe3w98nDvjasw0XBmBkCCAAY46H4CbXk26qROxeE9wiOavBq-O47C5s-hlmg_fhbdJX7xdmTdtuHN6RWqCII0JzIGcTyiEwJxsKt5Qb1dYWFINnh9xhb3J9KsWJRwESK4jB-WyIIGLr7zVKot5lFUt7hTgU8c6QeQijwjwqmxMUF8z2h-y7dV0prCt7o-JpbdcdTXAL7CuTte8WfH7nGiljeiDRdEkY-neBvzBRpd84RMR1392bQ4gppaxHU7S-ZkakJ5hSHoQKzg"
      }
      """