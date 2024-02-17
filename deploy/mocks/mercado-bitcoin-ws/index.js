const WebSocket = require('ws');

const clients = new Set();
const server = new WebSocket.Server({ port: 8088 });
server.broadcast = broadcast;

console.log(new Date(), '| Server is running.');
console.log(`App Web Socket Server is running!`);

let intervalsOrder = [];
let intervalOrder = undefined;
let intervalsTicker = [];
let intervalTicker = undefined;

function subscribeEvent(client, payload) {
  console.log(new Date(), '| SubscribeEvent clients.');

  if (payload.subscription.name == 'orderbook') {
    for (i of intervalsOrder) {
      if (
        i.id == payload.subscription.id &&
        i.limit == payload.subscription.limit
      ) {
        client.send(
          JSON.stringify({
            type: 'error',
            message: 'already subscribed',
          }),
        );
        return;
      }
    }
    sendOrderbookResponse(payload, client);
    intervalOrder = setInterval(function () {
      orderbook(client, payload);
    }, 300);
    intervalsOrder.push({
      intv: intervalOrder,
      id: payload.subscription.id,
      limit: payload.subscription.limit,
    });
  }

  if (payload.subscription.name == 'ticker') {
    for (i of intervalsTicker) {
      if (i.id == payload.subscription.id) {
        client.send(
          JSON.stringify({
            type: 'error',
            message: 'already subscribed',
          }),
        );
        return;
      }
    }
    sendTickerResponse(payload, client);
    intervalTicker = setInterval(function () {
      ticker(client, payload);
    }, 300);
    intervalsTicker.push({
      intv: intervalTicker,
      id: payload.subscription.id,
    });
  }
}

function ticker(client, payload) {
  if (!client._id) {
    client._id = new Set();
  }
  client._id.add(payload.subscription.id);

  const date = new Date().getTime();
  const nanoseconds = Math.floor(date * 1000000);

  client.send(
    JSON.stringify({
      type: 'ticker',
      id: payload.subscription.id,
      ts: nanoseconds,
      data: {
        high: String(priceGenerator(120000, 126535)),
        low: String(priceGenerator(115000, 120822.9375)),
        vol: String(priceGenerator(60, 63.65854143)),
        last: String(priceGenerator(125125, 125128.09478999)),
        buy: String(priceGenerator(120000, 124931.87500002)),
        sell: String(priceGenerator(122000, 125126.68109619)),
        open: String(priceGenerator(120000, 121500.0)),
        date,
      },
    }),
  );
  clients.add(client);
}

function orderbook(client, payload) {
  if (!client._id) {
    client._id = new Set();
  }
  if (!client._limit) {
    client._limit = new Set();
  }
  client._id.add(payload.subscription.id);
  client._limit.add(payload.subscription.limit);

  const nanoseconds = Math.floor(new Date().getTime() * 1000000);
  let asks = [];
  for (let i = 0; i < payload.subscription.limit; i++) {
    asks.push([priceGenerator(110000, 130000), priceGenerator(0.008, 1.5)]);
  }
  let bids = [];
  for (let i = 0; i < payload.subscription.limit; i++) {
    bids.push([priceGenerator(110000, 130000), priceGenerator(0.008, 1.5)]);
  }
  client.send(
    JSON.stringify({
      type: 'orderbook',
      id: payload.subscription.id,
      ts: nanoseconds,
      data: {
        asks,
      },
      bids,
      timestamp: nanoseconds,
    }),
  );
  clients.add(client);
}

function broadcast(jsonObject) {
  if (!this.clients) return;
  this.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(jsonObject));
      console.log(JSON.stringify(jsonObject));
    }
  });
}

server.on('connection', (client) => {
  client.on('message', function (message) {
    console.log(new Date(), '| New message.', JSON.parse(message));
    const payload = JSON.parse(message);
    if (payload.type == 'ping') server.broadcast({ type: 'pong' });
    if (payload.type === 'subscribe') {
      subscribeEvent(client, payload);
      return;
    }
    if (
      payload.type === 'unsubscribe' &&
      payload.subscription.name === 'orderbook'
    ) {
      unsusbcribeOrderbook(payload, client);
      sendOrderbookResponse(payload, client);
      return;
    } else if (
      payload.type === 'unsubscribe' &&
      payload.subscription.name === 'ticker'
    ) {
      unsusbcribeTicker(payload, client);
      sendTickerResponse(payload, client);
      return;
    }
  });

  function unsusbcribeOrderbook(payload, client) {
    if (!clients.size) {
      return;
    }
    let newArr = [];
    for (let i = 0; i < intervalsOrder.length; i++) {
      if (
        intervalsOrder[i].id != payload.subscription.id ||
        intervalsOrder[i].limit != payload.subscription.limit
      ) {
        newArr.push(intervalsOrder[i]);
      } else {
        clearInterval(intervalsOrder[i].intv);
        client._id.delete(intervalsOrder[i].id);
        client._limit.delete(intervalsOrder[i].limit);
      }
    }
    intervalsOrder = newArr;
    if (intervalsOrder.length == 0 && intervalsTicker.length == 0)
      clients.delete(client);
  }

  function unsusbcribeTicker(payload, client) {
    if (!clients.size) {
      return;
    }
    let newArr = [];
    for (let i = 0; i < intervalsTicker.length; i++) {
      if (intervalsTicker[i].id != payload.subscription.id) {
        newArr.push(intervalsTicker[i]);
      } else {
        clearInterval(intervalsTicker[i].intv);
        client._id.delete(intervalsTicker[i].id);
      }
    }
    intervalsTicker = newArr;
    if (intervalsOrder.length == 0 && intervalsTicker.length == 0)
      clients.delete(client);
  }

  client.on('close', () => {
    console.log(new Date(), '| Server closed.');
    clients.delete(client);
    intervalsTicker = [];
    intervalsOrder = [];
  });

  client.on('error', (error) =>
    console.log(new Date(), '| Server error.', error),
  );
});

function sendOrderbookResponse(payload, client) {
  client.send(
    JSON.stringify({
      id: payload.subscription.id,
      name: payload.subscription.name,
      limit: payload.subscription.limit,
    }),
  );
}

function sendTickerResponse(payload, client) {
  client.send(
    JSON.stringify({
      id: payload.subscription.id,
      name: payload.subscription.name,
    }),
  );
}

function priceGenerator(min, max) {
  const amplitude = max - min;
  return Math.random() * amplitude + min;
}
