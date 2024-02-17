import { Env, Support as _cy } from '../../../support/support';

describe('TC013 - Test - api pix type evp signup', () => {
  let env = Env();
  let headers;
  let token;
  let id;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('pix_key', 'pix_evp_id');
  });
  _cy._time(60000);

  it('UC001 - dismiss pix key type evp', async () => {
    const response = await _cy.post_request(
      `${env.pix}/${id.id}/dismiss`,
      null,
      headers,
    );
    _cy.expect(response, 'type', 'EVP');

    const dismiss = _cy.expect(response, 'state');
    if (dismiss === 'CANCELED' || dismiss === 'READY')
      expect(true).to.equal(true);
  });
  it('UC002 - dismiss pix key type evp invalid', async () => {
    const response = await _cy.post_request(
      `${env.pix}/${_cy.uuid_gen()}/dismiss`,
      null,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Chave Pix não encontrada. Por favor verifique e tente novamente.',
    );
  });
});
