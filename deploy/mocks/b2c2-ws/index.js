const WebSocket = require('ws');

const clients = new Set();
const instrumentsPriceInterval = {
  'BTCUSD.SPOT': [29000, 32000],
  'ETHUSD.SPOT': [1000, 2000],
  'EURUSD.SPOT': [1, 1.1],
  'LTCUSD.SPOT': [40, 70],
  'BCHUSD.SPOT': [100, 200],
  'XRPUSD.SPOT': [0.3, 0.5],
  'BTCUST.SPOT': [18000, 24000],
  'EOSUSD.SPOT': [0.9, 1.4],
  'USTUSC.SPOT': [1, 1.1],
};

const server = new WebSocket.Server({ port: 8088 });
console.log(new Date(), '| Server is running.');

setInterval(sendPrices, 1000);

server.on('connection', (client) => {
  console.log(new Date(), '| New connection.', clients.size);

  client.send(
    JSON.stringify({
      event: 'tradable_instruments',
      success: true,
      tradable_instruments: Object.keys(instrumentsPriceInterval),
    }),
  );

  client.on('close', () => {
    console.log(new Date(), '| Server closed.');
    clients.delete(client);
  });

  client.on('error', (error) =>
    console.log(new Date(), '| Server error.', error),
  );

  client.on('message', function (message) {
    console.log(new Date(), '| New message.', JSON.parse(message));
    const payload = JSON.parse(message);

    if (payload.event === 'subscribe') {
      subscribeEvent(client, payload);
      return;
    }
    if (payload.event === 'unsubscribe') {
      if (!clients.size) {
        return;
      }
      client._instruments.delete(payload.instrument);
      return;
    }
  });
});

function subscribeEvent(client, payload) {
  if (!client._instruments) {
    client._instruments = new Set();
  }

  let isInstrument = 0;
  for (inst of Object.keys(instrumentsPriceInterval)) {
    if (payload.instrument === inst) isInstrument++;
  }

  if (isInstrument > 0) {
    client._instruments.add(payload.instrument);

    client.send(
      JSON.stringify({
        success: true,
        event: payload.event,
        instrument: payload.instrument,
        tag: payload.tag,
      }),
    );

    clients.add(client);

    console.log('SubscribeEvent clients:', clients.size);
  }
}

function priceGenerator(min, max) {
  const offset = (max + min) / 2;
  const amplitude = max - min;
  return Math.sin((2 * Math.PI) / Math.random()) * amplitude + offset;
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
            instrument,
            success: true,
            event: 'price',
            levels: {
              buy: [{ quantity: '1', price: (1.01 * priceBase).toFixed(4) }],
              sell: [{ quantity: '1', price: (0.99 * priceBase).toFixed(4) }],
            },
            timestamp: Date.now(),
          }),
        );
      });
    }
  });
}
