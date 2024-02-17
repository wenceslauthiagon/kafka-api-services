import { P2POperationsPayloads as _payload } from '../../payloads/p2p_operations/payload';
import { Env, Support as _cy } from '../../support/support';

describe('TC049 - Test api  P2P Operations', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  let wallet;
  _cy._time(60000);
  let payload = _payload.body;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    wallet = await _cy.read_json(
      'p2p_operations',
      'create_wallet_for_operations',
    );
  });

  it('UC001 - create a new p2p transfers operations', async () => {
    let body = { ...payload };
    body.destination_wallet_id = wallet.id;
    const response = await _cy.post_request(
      `${env.p2p_operations}`,
      body,
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'amount_currency', 'BRL');
    _cy.expect(response, 'amount', body.amount);

    file = response.body.data;
  });
  it('create json file', async () => {
    await _cy.write_json('p2p_operations', 'create_p2p_operations', file);
  });
  it('UC002 - create a new p2p transfers operations wallet invalid', async () => {
    let body = { ...payload };
    body.destination_wallet_id = wallet.id;
    const response = await _cy.post_request(
      `${env.p2p_operations}`,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Falha nossa, mas sua operação pode ter sido completada! Verifique seu extrato antes de tentar novamente.',
    );
  });
  it('UC003 - create a new p2p transfers operations invalid pin', async () => {
    let body = { ...payload };
    body.destination_wallet_id = wallet.id;
    body.pin = '9999';
    const response = await _cy.post_request(
      `${env.p2p_operations}`,
      body,
      headers,
    );
    _cy.expect(response, 'message', 'Acesso negado.');
  });
  it('UC004 - create a new p2p transfers operations invalid amount', async () => {
    let body = { ...payload };
    body.destination_wallet_id = wallet.id;
    body.amount = 0;
    const response = await _cy.post_request(
      `${env.p2p_operations}`,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'O campo amount dever ser um valor positivo e recebemos 0.',
    );
  });
});
