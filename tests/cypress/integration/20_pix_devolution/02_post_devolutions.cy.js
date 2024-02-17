import { Env, Support as _cy } from '../../support/support';
import { PixDevolution as _body } from '../../payloads/pix_devolution/create_pix_devolution';

describe('TC056 - Test api pix devolutions - list users qrcode', () => {
  let env = Env();
  let headers;
  let payload = _body.body;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - Creat new pix devolution', async () => {
    const operation_id = _cy.uuid_gen();
    // const amount = _cy.generateNumber();
    let body = { ...payload };
    body.operation_id = operation_id;
    const response = await _cy.post_request(env.pix_devolution, body, headers);
    console.log(response);
    _cy.expect(response, 'operation_id');
    _cy.expect(response, 'state');
    _cy.expect(response, 'amount');
    _cy.expect(response, 'description');
    _cy.expect(response, 'created_at');
  });
});
