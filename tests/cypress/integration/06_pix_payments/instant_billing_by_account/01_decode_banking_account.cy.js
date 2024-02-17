import { Env, Support as _cy } from '../../../support/support';
import { PixPaymentsPayload as _payload } from '../../../payloads/pix_payments/payload';
import { DecodeMessage as _message } from '../../../mocks/pix_payments/decode_banking_account';

describe('TC022 - Test api pix payments decode banking', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  _cy._time(30000);
  let body = _payload.decode_by_account;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - POST decode banking account', async () => {
    const response = await _cy.post_request(
      `${env.pix_payments_decode}/by-account`,
      _payload.decode_by_account,
      headers,
    );
    _cy.expect(response, 'data');
    _cy.expect(response, 'id');
    _cy.expect(response, 'name');

    file = response.body.data;
  });

  it('create json file', async () => {
    await _cy.write_json('pix_payments', 'account_id', {
      id: _cy.findInJson(file, 'id'),
    });
  });

  it('UC002 - POST decode banking account invalid person_type', async () => {
    const string_ = _cy.generateString(6);
    let payload = { ...body };
    payload.person_type = string_;
    const response = await _cy.post_request(
      `${env.pix_payments_decode}/by-account`,
      payload,
      headers,
    );
    _cy.expect(
      response,
      'message',
      `O valor ${string_} não é aceito no parâmetro person_type.`,
    );
  });
  it('UC003 - POST decode banking account invalid document', async () => {
    const string_ = _cy.generateNumber(11);
    let payload = { ...body };
    payload.document = string_.toString();
    const response = await _cy.post_request(
      `${env.pix_payments_decode}/by-account`,
      payload,
      headers,
    );
    _cy.expect(
      response,
      'message',
      `O valor do parâmetro document não é um documento válido (CPF ou CNPJ).`,
    );
  });

  it('UC004 - POST decode banking account invalid bank_ispb', async () => {
    let string_ = _cy.generateNumber(8);
    let payload = { ...body };
    payload.bank_ispb = string_.toString();
    const response = await _cy.post_request(
      `${env.pix_payments_decode}/by-account`,
      payload,
      headers,
    );
    const message_one = _message.message_one;
    const message_two = `${_message.message_two} ${string_}.`;
    if (response.body.message === message_one) {
      _cy.expect(response, 'message', message_one);
    } else if (response.body.message === message_two) {
      _cy.expect(response, 'message', message_two);
    }
  });
  it('UC005 - POST decode banking account invalid account_type', async () => {
    let string_ = _cy.generateString(3);
    let payload = { ...body };
    payload.account_type = string_;
    const response = await _cy.post_request(
      `${env.pix_payments_decode}/by-account`,
      payload,
      headers,
    );
    _cy.expect(
      response,
      'message',
      `O valor ${string_} não é aceito no parâmetro account_type.`,
    );
  });
});
