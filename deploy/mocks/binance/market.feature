Feature: Binance Exchange Info Mock Server

  Scenario: pathMatches('/api/v3/exchangeInfo') && paramValue('permissions') == 'SPOT' && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "timezone": "UTC",
        "serverTime": 1688434504331,
        "rateLimits": [
          {
            "rateLimitType": "REQUEST_WEIGHT",
            "interval": "MINUTE",
            "intervalNum": 1,
            "limit": 1200
          },
          {
            "rateLimitType": "ORDERS",
            "interval": "SECOND",
            "intervalNum": 10,
            "limit": 50
          },
          {
            "rateLimitType": "ORDERS",
            "interval": "DAY",
            "intervalNum": 1,
            "limit": 160000
          },
          {
            "rateLimitType": "RAW_REQUESTS",
            "interval": "MINUTE",
            "intervalNum": 5,
            "limit": 6100
          }
        ],
        "exchangeFilters": [],
        "symbols": [
          {
            "symbol": "BTCBRL",
            "status": "TRADING",
            "baseAsset": "BTC",
            "baseAssetPrecision": 8,
            "quoteAsset": "BRL",
            "quotePrecision": 8,
            "quoteAssetPrecision": 8,
            "baseCommissionPrecision": 8,
            "quoteCommissionPrecision": 8,
            "orderTypes": [
              "LIMIT",
              "LIMIT_MAKER",
              "MARKET",
              "STOP_LOSS_LIMIT",
              "TAKE_PROFIT_LIMIT"
            ],
            "icebergAllowed": true,
            "ocoAllowed": true,
            "quoteOrderQtyMarketAllowed": true,
            "allowTrailingStop": true,
            "cancelReplaceAllowed": true,
            "isSpotTradingAllowed": true,
            "isMarginTradingAllowed": false,
            "filters": [
              {
                "filterType": "PRICE_FILTER",
                "minPrice": "1.00000000",
                "maxPrice": "10000000.00000000",
                "tickSize": "1.00000000"
              },
              {
                "filterType": "LOT_SIZE",
                "minQty": "0.00001000",
                "maxQty": "9000.00000000",
                "stepSize": "0.00001000"
              },
              {
                "filterType": "ICEBERG_PARTS",
                "limit": 10
              },
              {
                "filterType": "MARKET_LOT_SIZE",
                "minQty": "0.00000000",
                "maxQty": "18.63169270",
                "stepSize": "0.00000000"
              },
              {
                "filterType": "TRAILING_DELTA",
                "minTrailingAboveDelta": 10,
                "maxTrailingAboveDelta": 2000,
                "minTrailingBelowDelta": 10,
                "maxTrailingBelowDelta": 2000
              },
              {
                "filterType": "PERCENT_PRICE_BY_SIDE",
                "bidMultiplierUp": "5",
                "bidMultiplierDown": "0.2",
                "askMultiplierUp": "5",
                "askMultiplierDown": "0.2",
                "avgPriceMins": 5
              },
              {
                "filterType": "NOTIONAL",
                "minNotional": "10.00000000",
                "applyMinToMarket": true,
                "maxNotional": "9000000.00000000",
                "applyMaxToMarket": false,
                "avgPriceMins": 5
              },
              {
                "filterType": "MAX_NUM_ORDERS",
                "maxNumOrders": 200
              },
              {
                "filterType": "MAX_NUM_ALGO_ORDERS",
                "maxNumAlgoOrders": 5
              }
            ],
            "permissions": [
              "SPOT",
              "TRD_GRP_009",
              "TRD_GRP_010",
              "TRD_GRP_011",
              "TRD_GRP_012",
              "TRD_GRP_013"
            ]
          },
          {
            "symbol": "USDTBRL",
            "status": "TRADING",
            "baseAsset": "USDT",
            "baseAssetPrecision": 8,
            "quoteAsset": "BRL",
            "quotePrecision": 8,
            "quoteAssetPrecision": 8,
            "baseCommissionPrecision": 8,
            "quoteCommissionPrecision": 8,
            "orderTypes": [
              "LIMIT",
              "LIMIT_MAKER",
              "MARKET",
              "STOP_LOSS_LIMIT",
              "TAKE_PROFIT_LIMIT"
            ],
            "icebergAllowed": true,
            "ocoAllowed": true,
            "quoteOrderQtyMarketAllowed": true,
            "allowTrailingStop": true,
            "cancelReplaceAllowed": true,
            "isSpotTradingAllowed": true,
            "isMarginTradingAllowed": false,
            "filters": [
              {
                "filterType": "PRICE_FILTER",
                "minPrice": "0.00100000",
                "maxPrice": "10000.00000000",
                "tickSize": "0.00100000"
              },
              {
                "filterType": "LOT_SIZE",
                "minQty": "0.10000000",
                "maxQty": "9222449.00000000",
                "stepSize": "0.10000000"
              },
              {
                "filterType": "ICEBERG_PARTS",
                "limit": 10
              },
              {
                "filterType": "MARKET_LOT_SIZE",
                "minQty": "0.00000000",
                "maxQty": "453514.37541666",
                "stepSize": "0.00000000"
              },
              {
                "filterType": "TRAILING_DELTA",
                "minTrailingAboveDelta": 10,
                "maxTrailingAboveDelta": 2000,
                "minTrailingBelowDelta": 10,
                "maxTrailingBelowDelta": 2000
              },
              {
                "filterType": "PERCENT_PRICE_BY_SIDE",
                "bidMultiplierUp": "1.2",
                "bidMultiplierDown": "0.8",
                "askMultiplierUp": "1.2",
                "askMultiplierDown": "0.8",
                "avgPriceMins": 5
              },
              {
                "filterType": "NOTIONAL",
                "minNotional": "10.00000000",
                "applyMinToMarket": true,
                "maxNotional": "9000000.00000000",
                "applyMaxToMarket": false,
                "avgPriceMins": 5
              },
              {
                "filterType": "MAX_NUM_ORDERS",
                "maxNumOrders": 200
              },
              {
                "filterType": "MAX_NUM_ALGO_ORDERS",
                "maxNumAlgoOrders": 5
              }
            ],
            "permissions": [
              "SPOT",
              "TRD_GRP_009",
              "TRD_GRP_010",
              "TRD_GRP_011",
              "TRD_GRP_012",
              "TRD_GRP_013"
            ]
          },
          {
            "symbol": "ETHBRL",
            "status": "TRADING",
            "baseAsset": "ETH",
            "baseAssetPrecision": 8,
            "quoteAsset": "BRL",
            "quotePrecision": 8,
            "quoteAssetPrecision": 8,
            "baseCommissionPrecision": 8,
            "quoteCommissionPrecision": 8,
            "orderTypes": [
              "LIMIT",
              "LIMIT_MAKER",
              "MARKET",
              "STOP_LOSS_LIMIT",
              "TAKE_PROFIT_LIMIT"
            ],
            "icebergAllowed": true,
            "ocoAllowed": true,
            "quoteOrderQtyMarketAllowed": true,
            "allowTrailingStop": true,
            "cancelReplaceAllowed": true,
            "isSpotTradingAllowed": true,
            "isMarginTradingAllowed": false,
            "filters": [
              {
                "filterType": "PRICE_FILTER",
                "minPrice": "0.01000000",
                "maxPrice": "200000.00000000",
                "tickSize": "0.01000000"
              },
              {
                "filterType": "LOT_SIZE",
                "minQty": "0.00010000",
                "maxQty": "45000.00000000",
                "stepSize": "0.00010000"
              },
              {
                "filterType": "ICEBERG_PARTS",
                "limit": 10
              },
              {
                "filterType": "MARKET_LOT_SIZE",
                "minQty": "0.00000000",
                "maxQty": "83.97619500",
                "stepSize": "0.00000000"
              },
              {
                "filterType": "TRAILING_DELTA",
                "minTrailingAboveDelta": 10,
                "maxTrailingAboveDelta": 2000,
                "minTrailingBelowDelta": 10,
                "maxTrailingBelowDelta": 2000
              },
              {
                "filterType": "PERCENT_PRICE_BY_SIDE",
                "bidMultiplierUp": "5",
                "bidMultiplierDown": "0.2",
                "askMultiplierUp": "5",
                "askMultiplierDown": "0.2",
                "avgPriceMins": 5
              },
              {
                "filterType": "NOTIONAL",
                "minNotional": "10.00000000",
                "applyMinToMarket": true,
                "maxNotional": "9000000.00000000",
                "applyMaxToMarket": false,
                "avgPriceMins": 5
              },
              {
                "filterType": "MAX_NUM_ORDERS",
                "maxNumOrders": 200
              },
              {
                "filterType": "MAX_NUM_ALGO_ORDERS",
                "maxNumAlgoOrders": 5
              }
            ],
            "permissions": [
              "SPOT",
              "TRD_GRP_009",
              "TRD_GRP_010",
              "TRD_GRP_011",
              "TRD_GRP_012",
              "TRD_GRP_013"
            ]
          }
        ]
      }
      """
