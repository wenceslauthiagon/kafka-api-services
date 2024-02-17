Feature: asaas create qrcode static mock server

    Scenario: pathMatches('/api/v3/pix/qrCodes/static') && methodIs('post')
        * def responseStatus = 200
        * def response =
            """
            {
                "id": "ZROINSTI00000000421681ASA",
                "encodedImage": null,
                "payload": "00020126580014br.gov.bcb.pix0136eafd4dae-1e04-446f-9a8a-cf2e57a594f152040000530398654071212.105802BR5925ZRO INSTITUICAO DE PAGAME6006Recife62290525ZROINSTI00000000421681ASA6304B204",
                "allowsMultiplePayments": false,
                "expirationDate": "2023-08-29 14:40:04",
                "permittedPayerDocument": "96545734075"
            }
            """