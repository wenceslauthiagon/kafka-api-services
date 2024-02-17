Feature: payments-gateway get dashboard mock server

    Background:
        * def randomArrayPosition = function(data){ return data[Math.floor(Math.random() * data.length)]; }
        * def status = ['paid','pending','failed','paid_by_third_party','paid_without_qr_code'];
        * def randomStatus = randomArrayPosition(status)
        * def type = ['transaction', 'withdraw', 'refund', 'returned'];
        * def randomType = randomArrayPosition(type)
        * def randomTotalItems = Math.floor(Math.random() * 10) + 1
        * def randomTotalValue = Math.floor(Math.random() * 4001) + 1000

    Scenario: pathMatches('/api/dashboards') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            [
                {
                    "type":"#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },   
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },   
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },      
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },   
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },   
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },  
                {
                    "type": "#(randomType)",
                    "status": "#(randomStatus)",
                    "total_items": "#(randomTotalItems)",
                    "total_value": "#(randomTotalValue)",
                },                         
            ]
            """