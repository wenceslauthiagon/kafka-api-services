import { Env, Support as _cy } from '../../support/support';

describe('TC050 - Test api  Operations limits type', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list operations limits type', async () => {
    const response = await _cy.get_request(
      env.operations_limites_types,
      headers,
    );
    const array = response.body.data.data;
    for (let validation of array) {
      _cy.expect(validation, 'id');
      _cy.expect(validation, 'tag');
    }
    file = response.body.data.data;
  });
  it('create json file', async () => {
    await _cy.write_json(
      'operations_limits_type',
      'operations_limits_type_list',
      file,
    );
  });

  it('UC002 - get operations limits type TAG', async () => {
    for (let tags of file) {
      const response = await _cy.get_request(
        `${env.operations_limites_types}&tag=${tags.tag}`,
        headers,
      );
      _cy.expect(response, 'tag', tags.tag);
      _cy.expect(response, 'id', tags.id);
    }
  });

  it('UC003 - get  operations limits type TAG invalid', async () => {
    const response = await _cy.get_request(
      `${env.operations_limites_types}&tag=TESTE  `,
      headers,
    );
    console.log(JSON.stringify(response.body));

    _cy.expect(response.body, 'total', 0);
  });
});
