import { PixPaymentsPayload as _payload } from '../../../payloads/pix_payments/payload';
import { Env, Support as _cy } from '../../../support/support';

describe('TC019 - Test api pix payments create QR code static', () => {
  let env = Env();
  let headers;
  let token;
  let json_file;
  let body = _payload.create;
  let key_id;
  let id;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    json_file = await _cy.read_json('pix_payments', 'list_keys');
  });
  it('UC001 - create a static qr code', async () => {
    const state = _cy.findInJson(json_file[0], 'state_description');
    if (state === 'Pronta para uso') {
      key_id = json_file[0].id;
    }
    let payload = { ...body };
    payload.key_id = key_id;
    payload.summary = 'Test payments';
    const response = await _cy.post_request(env.pix_payments, payload, headers);
    _cy.expect(response, 'created_at');
    _cy.expect(response, 'id');
    _cy.expect(response, 'key_id');
    _cy.expect(response, 'state');
    _cy.expect(response, 'summary');
    _cy.expect(response, 'value');
    id = _cy.findInJson(response, 'id');
  });
  it('UC002 -Create JSON id', async () => {
    await _cy.write_json('pix_payments', 'qr_code_static', { id: id });
  });
  it('UC003 - create a static qr code indalid uuid', async () => {
    let payload = { ...body };
    payload.key_id = _cy.uuid_gen();
    const response = await _cy.post_request(env.pix_payments, payload, headers);
    _cy.expect(
      response,
      'message',
      'Chave Pix não encontrada. Por favor verifique e tente novamente.',
    );
  });
  it('UC004 - create a static qr code invalid value', async () => {
    let payload = { ...body };
    payload.key_id = key_id;
    payload.value = 0;
    const response = await _cy.post_request(env.pix_payments, payload, headers);
    _cy.expect(
      response,
      'message',
      'O campo value dever ser um valor positivo e recebemos 0.',
    );
  });
  it('UC005 - create static qr code with exercise limit summary', async () => {
    let summary = _cy.generateString(141);
    let payload = { ...body };
    payload.key_id = key_id;
    payload.summary = summary;
    const response = await _cy.post_request(env.pix_payments, payload, headers);
    _cy.expect(
      response,
      'message',
      `O tamanho máximo do campo summary é summary must be shorter than or equal to 140 characters e recebemos ${summary}.`,
    );
  });
  it('UC006 - create static qr code with exercise limit description', async () => {
    let description = _cy.generateString(141);
    let payload = { ...body };
    payload.key_id = key_id;
    payload.summary = 'Test payments';
    payload.description = description;
    const response = await _cy.post_request(env.pix_payments, payload, headers);
    _cy.expect(
      response,
      'message',
      `O tamanho máximo do campo description é description must be shorter than or equal to 140 characters e recebemos ${description}.`,
    );
  });
});
