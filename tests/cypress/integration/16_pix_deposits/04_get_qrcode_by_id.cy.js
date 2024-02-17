import { Env, Support as _cy } from '../../support/support';

describe('TC058 - Test api pix deposits - list qrcode', () => {
  let env = Env();
  let headers;
  let token;
  let id;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('pix_deposits', 'qrcode_static');
  });
  it('UC001 - list qrcode by id', async () => {
    const response = await _cy.get_request(`${env.deposits}/${id.id}`, headers);
    const list = [
      'created_at',
      'description',
      'emv',
      'id',
      'key_id',
      'state',
      'summary',
      'txid',
      'value',
    ];
    for (let validate of list) {
      _cy.expect(response, validate);
    }
  });
});
