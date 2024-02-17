import { SignupMock as _mock } from '../../mocks/signup/signup';
import { SignupPayload as _body } from '../../payloads/signup/signup';
import { Env, Support as _cy } from '../../support/support';

describe('TC017 - Test - API Signup - Confirm Code', () => {
  let env = Env();
  let payload = _body.body_confirm;
  let id;

  _cy._time(30000);
  before(async () => {
    await cy
      .readFile('../tests/cypress/fixtures/signup/signup_id.json')
      .then((data) => {
        id = data.id;
      });
  });

  it('UC001 - validating the received code', async () => {
    const response = await _cy.post_request(
      `${env.signup}/${id}/code`,
      payload,
    );
    const id_confirm = _cy.findInJson(response, 'id');
    _mock.mock.data.id = id_confirm;
    _cy.expect(_mock.mock, 'id');
    _cy.expect(_mock.mock, 'state', 'CONFIRMED');
  });

  it('UC002 - passing invalid code', async () => {
    let _code = { ...payload };
    _code.confirmCode = '1234';

    const response = await _cy.post_request(`${env.signup}/${id}/code`, _code);
    _cy.expect(
      response,
      'message',
      `O tamanho do campo confirmCode não foi o esperado e recebemos ${_code.confirmCode}.`,
    );
  });
});
