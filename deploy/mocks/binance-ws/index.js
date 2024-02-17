const WebSocket = require('ws');

const clients = new Set();
const instrumentsPriceInterval = {
  BTCBRL: [149000.0, 151000.0],
  ETHBRL: [9400.0, 9500.0],
  USDTBRL: [4.8, 5.0],
};

const server = new WebSocket.Server({ port: 8088 });
console.log(new Date(), '| Server is running.');

setInterval(sendPrices, 1000);

server.on('connection', (client) => {
  console.log(new Date(), '| New connection.', clients.size);

  client.on('close', () => {
    console.log(new Date(), '| Server closed.');
    if (clients.size) {
      clients.delete(client);
    }
  });

  client.on('error', (error) =>
    console.log(new Date(), '| Server error.', error),
  );

  client.on('message', function (message) {
    console.log(new Date(), '| New message.', JSON.parse(message));
    const payload = JSON.parse(message);
    let coin = payload.params[0].split('@');
    coin = coin[0].toUpperCase();

    if (payload.method === 'SUBSCRIBE') {
      subscribeEvent(client, coin);
      return;
    }
    if (payload.method === 'UNSUBSCRIBE') {
      if (!clients.size) {
        return;
      }
      client._instruments.delete(coin);
      return;
    }
  });
});

function subscribeEvent(client, coin) {
  if (!client._instruments) {
    client._instruments = new Set();
  }

  let isInstrument = 0;

  for (inst of Object.keys(instrumentsPriceInterval)) {
    if (coin === inst) isInstrument++;
  }

  if (isInstrument > 0) {
    client._instruments.add(coin);

    client.send(
      JSON.stringify({
        result: null,
        id: 1,
      }),
    );

    clients.add(client);

    console.log(new Date(), '| SubscribeEvent clients:', clients.size);
  }
}

function priceGenerator(min, max) {
  return Math.random() * (max - min) + min;
}

function sendPrices() {
  if (!clients.size) {
    return;
  }

  clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client._instruments &&
      client._instruments.size
    ) {
      client._instruments.forEach((instrument) => {
        if (!instrumentsPriceInterval[instrument]) {
          console.warn('Instrument not found.', { instrument });
          return;
        }

        const priceBase = priceGenerator(
          ...instrumentsPriceInterval[instrument],
        );

        client.send(
          JSON.stringify({
            e: '24hrTicker',
            E: parseInt(priceGenerator(1000000000000, 2000000000000)),
            s: instrument.toString(),
            p: (-priceGenerator(100, 500).toFixed(8)).toString(),
            P: (-priceGenerator(3, 4).toFixed(3)).toString(),
            w: (1.05 * priceBase).toFixed(4).toString(),
            x: (1.1 * priceBase).toFixed(4).toString(),
            c: (1.02 * priceBase).toFixed(4).toString(),
            Q: (-priceGenerator(0, 1).toFixed(8)).toString(),
            b: (1.01 * priceBase).toFixed(4).toString(),
            B: (-priceGenerator(0, 1).toFixed(8)).toString(),
            a: (0.99 * priceBase).toFixed(4).toString(),
            A: (-priceGenerator(0, 1).toFixed(8)).toString(),
            o: (1.09 * priceBase).toFixed(4).toString(),
            h: (1.15 * priceBase).toFixed(4).toString(),
            l: (1.095 * priceBase).toFixed(4).toString(),
            v: priceGenerator(145000, 180000).toFixed(8).toString(),
            q: priceGenerator(1100000000, 1300000000).toFixed(8).toString(),
            O: parseInt(priceGenerator(1000000000000, 2000000000000)),
            C: parseInt(priceGenerator(1000000000000, 2000000000000)),
            F: parseInt(priceGenerator(600000000, 700000000)),
            L: parseInt(priceGenerator(600000000, 700000000)),
            n: parseInt(priceGenerator(1000000, 2000000)),
          }),
        );
      });
    }
  });
}
