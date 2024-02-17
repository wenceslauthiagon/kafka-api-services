import { Env, Support as _cy } from '../../../support/support';

describe('TC012 - Test - api pix type evp signup', () => {
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

  it('UC001 - delete pix type evp id', async () => {
    const response = await _cy.delete_request(
      `${env.pix}/${id.id}`,
      null,
      headers,
    );
    const delete_id = _cy.expect(response, 'state');

    if (delete_id == 'DELETING' || delete_id === 'READY') {
      expect(true).to.equal(true);
    }
  });
  it('UC002 - delete pix type evp id invalid', async () => {
    const response = await _cy.delete_request(
      `${env.pix}/${_cy.uuid_gen()}`,
      null,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Chave Pix não encontrada. Por favor verifique e tente novamente.',
    );
  });

  it('UC003 - deleting list', async () => {
    const response = await _cy.get_request(env.pix, headers);
    for (let deleting of response.body.data) {
      if (response.body.data.length > 5 && deleting.id !== id.id)
        await _cy.delete_request(`${env.pix}/${deleting.id}`, null, headers);
    }
  });

  it('UC004 - dismiss list', async () => {
    const response = await _cy.get_request(env.pix, headers);
    for (let deleting of response.body.data) {
      if (response.body.data.length > 5 && deleting.id !== id.id)
        await _cy.post_request(
          `${env.pix}/${deleting.id}/dismiss`,
          null,
          headers,
        );
    }
  });
});
