import { DepositsPayload as _body } from '../../payloads/pix_deposits/create_static_qrcode';
import { Env, Support as _cy } from '../../support/support';
describe('TC057 - Test api pix deposits - create static qrcode', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  let payload = _body.body;
  let id;
  let id_qrcode;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    file = await _cy.read_json('pix_deposits', 'list_keys');
  });
  it('UT001 - create qrcode', async () => {
    for (let list of file) {
      const state = _cy.findInJson(list, 'state_description');
      if (state === 'Pronta para uso') {
        id = list.id;
      }
    }
    const value = _cy.generateNumber(4);
    let body = { ...payload };
    body.key_id = id;
    body.value = value;
    const response = await _cy.post_request(env.deposits, body, headers);
    _cy.expect(response, 'id');
    _cy.expect(response, 'key_id');
    _cy.expect(response, 'state');
    _cy.expect(response, 'summary');
    _cy.expect(response, 'value');
    _cy.expect(response, 'description');
    _cy.expect(response, 'created_at');
    id_qrcode = _cy.findInJson(response, 'id');
  });
  it('UT002 - Exceed summary character limit', async () => {
    const value = _cy.generateNumber(4);
    const summary = _cy.generateString(141);
    let body = { ...payload };
    body.key_id = id;
    body.value = value;
    body.summary = summary;
    const response = await _cy.post_request(env.deposits, body, headers);
    _cy.expect(
      response,
      'message',
      `O tamanho máximo do campo summary é summary must be shorter than or equal to 140 characters e recebemos ${summary}.`,
    );
  });
  it('UT003 - Exceed description character limit', async () => {
    const value = _cy.generateNumber(4);
    const description = _cy.generateString(141);
    let body = { ...payload };
    body.key_id = id;
    body.value = value;
    body.description = description;
    const response = await _cy.post_request(env.deposits, body, headers);
    _cy.expect(
      response,
      'message',
      `O tamanho máximo do campo description é description must be shorter than or equal to 140 characters e recebemos ${description}.`,
    );
  });
  it('create JSON id', async () => {
    await _cy.write_json('pix_deposits', 'qrcode_static', { id: id_qrcode });
  });
});
