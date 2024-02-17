Feature: payments-gateway get orders mock server

    Background:
        * def id = function(){ return Math.floor(Math.random() * (10000 - 1)) + 1; }
    
    Scenario: pathMatches('/api/orders/refunds') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "data": [
                    {
                        "id": "#(id())",
                        "value_cents": 100,
                        "fee_in_percent": "0.5",
                        "company_id": "#(id())",
                        "transaction_id": "#(id())",
                        "transaction": {
                            "payment_type": "teste",
                            "kyc": {
                                "of_legal_age":true,
                                "birthdate":"test",  
                                "suspected_death":false,
                                "pep":"test",
                                "age":35
                            },
                        },
                        "total_value_shopkeeper_cents": 8900,
                        "payment_status": "paid",
                        "created_at": "2023-02-02T16:05:13+00:00",
                        "updated_at": "2023-02-02T16:05:13+00:00"
                    },
                    {
                        "id": "#(id())",
                        "value_cents": 100,
                        "fee_in_percent": "0.5",
                        "company_id": "#(id())",
                        "transaction_id": "#(id())",
                        "transaction": {
                            "payment_type": "teste",
                            "kyc": {
                                "of_legal_age":true,
                                "birthdate":"test",  
                                "suspected_death":false,
                                "pep":"test",
                                "age":35
                            },
                        },
                        "total_value_shopkeeper_cents": 8900,
                        "payment_status": "paid",
                        "created_at": "2023-02-02T16:05:13+00:00",
                        "updated_at": "2023-02-02T16:05:13+00:00"
                    }
                ],
                "links": {
                    "first": "http://localhost:81/api/orders?page=1",
                    "last": "http://localhost:81/api/orders?page=2",
                    "prev": null,
                    "next": "http://localhost:81/api/transactions/deposit?page=2"
                },
                "meta": {
                    "links": [
                        {
                            "url": null,
                            "label": "&laquo; Previous",
                            "active": false
                        },
                        {
                            "url": "http://localhost:81/api/orders?page=1",
                            "label": "1",
                            "active": true
                        },
                        {
                            "url": null,
                            "label": "Next &raquo;",
                            "active": false
                        }
                    ],
                    "path": "http://localhost:81/api/orders",
                    "per_page": 15,
                    "to": 2,
                    "total": 2
                }
            }
            """

    Scenario: pathMatches('/api/orders/refunds/{id}') && methodIs('get')
        * def responseStatus = 200
        * def orderId = parseInt(pathParams.id)
        * def response =
            """
            {
                "id": "#(orderId)",
                "value_cents": 100,
                "fee_in_percent": "0.5",
                "company_id": "#(id())",
                "transaction_id": "#(id())",
                "transaction": {
                    "payment_type": "teste",
                    "kyc": {
                        "of_legal_age":true,
                        "birthdate":"test",  
                        "suspected_death":false,
                        "pep":"test",
                        "age":35
                    },
                },
                "total_value_shopkeeper_cents": 8900,
                "payment_status": "paid",
                "created_at": "2023-02-02T16:05:13+00:00",
                "updated_at": "2023-02-02T16:05:13+00:00"
            }
            """

    Scenario: pathMatches('/api/orders') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "data": [
                    {
                        "id": "#(id())",
                        "value_cents": 100,
                        "fee_in_percent": "0.5",
                        "company_id": "#(id())",
                        "transaction_id": "#(id())",
                        "transaction": {
                            "payment_type": "teste",
                            "kyc": {
                                "of_legal_age":true,
                                "birthdate":"test",  
                                "suspected_death":false,
                                "pep":"test",
                                "age":35
                            },
                        },
                        "total_value_shopkeeper_cents": 8900,
                        "payment_status": "paid",
                        "created_at": "2023-02-02T16:05:13+00:00",
                        "updated_at": "2023-02-02T16:05:13+00:00"
                    },
                    {
                        "id": "#(id())",
                        "value_cents": 100,
                        "fee_in_percent": "0.5",
                        "company_id": "#(id())",
                        "transaction_id": "#(id())",
                        "transaction": {
                            "payment_type": "teste",
                            "kyc": {
                                "of_legal_age":true,
                                "birthdate":"test",  
                                "suspected_death":false,
                                "pep":"test",
                                "age":35
                            },
                        },
                        "total_value_shopkeeper_cents": 8900,
                        "payment_status": "paid",
                        "created_at": "2023-02-02T16:05:13+00:00",
                        "updated_at": "2023-02-02T16:05:13+00:00"
                    }
                ],
                "links": {
                    "first": "http://localhost:81/api/orders?page=1",
                    "last": "http://localhost:81/api/orders?page=2",
                    "prev": null,
                    "next": "http://localhost:81/api/transactions/deposit?page=2"
                },
                "meta": {
                    "links": [
                        {
                            "url": null,
                            "label": "&laquo; Previous",
                            "active": false
                        },
                        {
                            "url": "http://localhost:81/api/orders?page=1",
                            "label": "1",
                            "active": true
                        },
                        {
                            "url": null,
                            "label": "Next &raquo;",
                            "active": false
                        }
                    ],
                    "path": "http://localhost:81/api/orders",
                    "per_page": 15,
                    "to": 2,
                    "total": 2
                }
            }
            """

    Scenario: pathMatches('/api/orders/{id}') && methodIs('get')
        * def responseStatus = 200
        * def orderId = parseInt(pathParams.id)
        * def response =
            """
            {
                "id": "#(orderId)",
                "value_cents": 100,
                "fee_in_percent": "0.5",
                "company_id": "#(id())",
                "transaction_id": "#(id())",
                "transaction": {
                    "payment_type": "teste",
                    "kyc": {
                        "of_legal_age":true,
                        "birthdate":"test",  
                        "suspected_death":false,
                        "pep":"test",
                        "age":35
                    },
                },
                "total_value_shopkeeper_cents": 8900,
                "payment_status": "paid",
                "created_at": "2023-02-02T16:05:13+00:00",
                "updated_at": "2023-02-02T16:05:13+00:00"
            }
            """