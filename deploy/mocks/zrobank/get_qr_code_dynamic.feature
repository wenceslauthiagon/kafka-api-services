Feature: zrobank get qrcode dynamic mock server

    Scenario: pathMatches('/pix/deposits/qr-codes/dynamic/{id}') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "success": true,
                "data": {
                    "id": "f6e2e084-29b9-4935-a059-5473b13033aa",
                    "txid": "f6e2e084-29b9-4935-a059-5473b13033aa",
                    "emv": "f6e2e084-29b9-4935-a059-5473b13033aa",
                    "key_id": "f6e2e084-29b9-4935-a059-5473b13033aa",
                    "state": "READY",
                    "summary": "party-payment",
                    "description": "The party payment.",
                    "expiration_date": "#(new Date().toISOString())",
                    "created_at": "#(new Date().toISOString())"
                },
                "error": null
            }
            """