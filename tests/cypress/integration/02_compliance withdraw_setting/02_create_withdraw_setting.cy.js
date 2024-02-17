import { ComplianceWitdramal as _body } from '../../payloads/compliance/create_user_withdrawal_request';
import { Env, Support as _cy } from '../../support/support';
const { v4: uuidv4 } = require('uuid');
describe('TC005 - Test - API Compliance Withdraw setting request - Create withdraw setting', () => {
  let env = Env();
  let id;
  let token;
  let headers;
  let payload = _body.body;
  let id_request;

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    await cy
      .readFile('../tests/cypress/fixtures/compliance/id_wallets.json')
      .then((data) => {
        id = data.id;
      });
  });
  _cy._time(60000);

  it('UC001 - create a withdrawal settings request', async () => {
    const body = { ...payload };
    body.wallet_id = id;
    const response = await _cy.post_request(
      env.get_request_whithdrawal,
      body,
      headers,
    );
    _cy.expect(response, 'data');
    _cy.expect(response, 'balance');
    _cy.expect(response, 'id');
    _cy.expect(response, 'pix_key_type');
    _cy.expect(response, 'state');
    _cy.expect(response, 'transaction_type_tag');
    _cy.expect(response, 'type');
    _cy.expect(response, 'wallet_id');
    id_request = _cy.findInJson(response, 'id');
  });

  it('create JSON id withdraw setting', () => {
    cy.writeFile(
      '../tests/cypress/fixtures/compliance/id_create_wihtdrawal.json',
      {
        id: id_request,
      },
    );
  });

  it('UC002 - try generate wallet with invalid uuid', async () => {
    let body = { ...payload };
    body.wallet_id = uuidv4();
    const response = await _cy.post_request(
      env.get_request_whithdrawal,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Não foi possível encontrar a associação do usuário à carteira.',
    );
  });

  it('UC003 - try generate wallet with invalid transaction_type_tag', async () => {
    let body = { ...payload };
    body.transaction_type_tag = Array.from({ length: 7 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    ).join('');
    body.wallet_id = id;
    const response = await _cy.post_request(
      env.get_request_whithdrawal,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    );
  });

  it('UC004 - try generate wallet with invalid pix_key_type', async () => {
    const data_faker = Array.from({ length: 4 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    ).join('');
    let body = { ...payload };
    // body.transaction_type_tag = 'PIXSEND';
    body.pix_key_type = data_faker;
    body.wallet_id = id;

    const response = await _cy.post_request(
      env.get_request_whithdrawal,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      `O valor ${data_faker} não é aceito no parâmetro pix_key_type.`,
    );
  });

  it('UC005 - try generate wallet with invalid type', async () => {
    const data_faker = Array.from({ length: 5 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    ).join('');
    let body = { ...payload };
    //  body.transaction_type_tag = 'PIXSEND';
    //  body.pix_key_type = 'CNPJ';
    body.type = data_faker;
    body.wallet_id = id;

    const response = await _cy.post_request(
      env.get_request_whithdrawal,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      `O valor ${data_faker} não é aceito no parâmetro type.`,
    );
  });
});
