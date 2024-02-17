import { SignupPayload as _body } from '../../payloads/signup/signup';
import { Env, Support as _cy } from '../../support/support';

describe('TC014 - Test - API Signup - Signup', () => {
  let env = Env();
  let payload = _body.body;
  let id_signup;

  _cy._time(30000);

  it('UC001 - validate create signup', async () => {
    const response = await _cy.post_request(env.signup, _body.body);
    _cy.expect(response, 'data');
    _cy.expect(response, 'id');
    _cy.expect(response, 'state', 'PENDING');
    id_signup = _cy.findInJson(response, 'id');
  });

  it('create JSON id signup', () => {
    cy.writeFile('../tests/cypress/fixtures/signup/signup_id.json', {
      id: id_signup,
    });
  });

  it('UC002 - passing an invalid email', async () => {
    let _payload = { ...payload };
    _payload.email = 'xxx';

    const response = await _cy.post_request(env.signup, _payload);

    _cy.expect(
      response,
      'message',
      `O valor do parâmetro email deveria ser um e-mail e recebemos ${_payload.email}.`,
    );
  });

  it('UC003 - passing invalid phone number', async () => {
    let _payload = { ...payload };
    _payload.phone_number = '123';

    const response = await _cy.post_request(env.signup, _payload);

    _cy.expect(
      response,
      'message',
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    );
  });

  it('UC004 - passing invalid password with a minimum length', async () => {
    let _payload = { ...payload };
    _payload.password = '1234567';

    const response = await _cy.post_request(env.signup, _payload);

    _cy.expect(
      response,
      'message',
      `O tamanho mínimo do campo password é 8 e recebemos ${_payload.password}.`,
    );
  });
});
