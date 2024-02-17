Feature: genial create qrcode dynamic mock server

    Scenario: pathMatches('/v1/pix/qrcode-dynamic') && methodIs('post')
        * def responseStatus = 200
        * def response =
            """
            {
                "data":{
                    "items":[
                        {
                            "itemId":"4d630166-0646-4813-a4d8-3634383e130c",
                            "data":{
                                "textContent":"00020101021226990014br.gov.bcb.pix2577pix.bancogenial.com/qrs1/v2/01KfnjyxrIjbBYWpGibducBeORSF8PrUqPNOP8uYG6kPEGPnZ52040000530398654041.005802BR5910LCT-BETDEV6009SAO PAULO62070503***630443DD",
                                "reference":"48fb30c1af8741b5a646de18b238713e",
                                "qrcodeURL":"https://pix.bancogenial.com/qrs1/v2/01KfnjyxrIjbBYWpGibducBeORSF8PrUqPNOP8uYG6kPEGPnZ"
                            },
                            "error":null
                        }
                    ]
                }
            }
            """