import { BankMock as _mock } from '../../mocks/banks/cretae_currency';
import { BanksPayload as _body } from '../../payloads/banks/create_currency';
import { Env, Support as _cy } from '../../support/support';

describe('TC037 - Test api banks ted create', () => {
  let env = Env();
  let headers;
  let token;
  let cpf = _cy.generateCpf();
  let payload = _body.body;
  let id;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  it('Create currency bankingTed', async () => {
    let body = { ...payload };
    body.beneficiary_document = cpf;
    const response = await _cy.post_request(env.banks_ted, body, headers);
    _cy.expect(response, 'id');
    _cy.expect(response, 'operation_id');
    _cy.expect(response, 'created_at');
    id = _cy.findInJson(response, 'id');
  });
  it('create JSON id', async () => {
    _cy.write_json('banks', 'id_currency', { id: id });
  });
  it('create with code bank invalid', async () => {
    let body = { ...payload };
    body.beneficiary_document = cpf;
    body.beneficiary_bank_code = '123';
    const response = await _cy.post_request(env.banks_ted, body, headers);
    _cy.expect(
      response,
      'message',
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    );
  });
  it('create with name empyt', async () => {
    let body = { ...payload };
    body.beneficiary_document = cpf;
    body.beneficiary_name = '';
    const response = await _cy.post_request(env.banks_ted, body, headers);
    _cy.expect(
      response,
      'message',
      'Dados obrigatórios necessários: Beneficiary Name.',
    );
  });
  it('create with document invalid', async () => {
    let number = _cy.generateNumber(9);
    let body = { ...payload };
    body.beneficiary_document = number.toString();
    const response = await _cy.post_request(env.banks_ted, body, headers);
    const message = _cy.findInJson(response, 'message');
    if (message === _mock.message_one) {
      _cy.expect(response, 'message', _mock.message_one);
    } else if (message === _mock.message_two) {
      _cy.expect(response, 'message', _mock.message_two);
    }
  });
});
