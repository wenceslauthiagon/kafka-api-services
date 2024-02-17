import { Env, Support as _cy } from '../../../support/support';
import { TypeEvp } from '../../../payloads/pix/type_evp';

describe('TC010 - Test - api pix type evp signup', () => {
  let env = Env();
  let headers;
  let token;
  let id_signup;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  _cy._time(60000);
  it('UC001 - signup a new pix key type evp', async () => {
    const response = await _cy.post_request(
      env.pix,
      TypeEvp.body_post,
      headers,
    );
    id_signup = _cy.expect(response, 'id');
    _cy.expect(response, 'state', 'CONFIRMED');
  });

  it('create JSON id signup pix key type evp', async () => {
    await _cy.write_json('pix_key', 'pix_evp_id', {
      id: id_signup,
    });
  });

  it('UC002 - signup a new pix key type evp invalid', async () => {
    let evp_invalid = TypeEvp.body_post;
    let string_evp = _cy.generateString(3);
    evp_invalid.type = string_evp;
    const response = await _cy.post_request(env.pix, evp_invalid, headers);
    _cy.expect(
      response,
      'message',
      `O valor ${string_evp} não é aceito no parâmetro type.`,
    );
  });
});
