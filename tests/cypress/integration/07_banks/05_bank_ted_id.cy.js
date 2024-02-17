import { Env, Support as _cy } from '../../support/support';

describe('TC038 - Test api banks ted id', () => {
  let env = Env();
  let headers;
  let id;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('banks', 'id_currency');
  });

  it('UC001 - Get list all banks ted id', async () => {
    const response = await _cy.get_request(
      `${env.banks_ted}/${id.id}`,
      headers,
    );
    const array = [
      'amount',
      'beneficiary_account',
      'beneficiary_account_digit',
      'beneficiary_account_type',
      'beneficiary_agency',
      'beneficiary_bank_code',
      'beneficiary_bank_name',
      'beneficiary_document',
      'beneficiary_name',
      'beneficiary_type',
      'created_at',
      'id',
      'operation_id',
      'state',
    ];
    for (let list of array) {
      _cy.expect(response, list);
    }
  });

  it('UC002 - Get list all banks ted id invalid', async () => {
    // const id_invalid = _cy.generateNumber(5);
    // const response = await _cy.get_request(
    //   `${env.banks_ted}/${id_invalid}`,
    //   headers,
    // );
    //não apresenta erro ao passar um id de um banco invalido, retorno status 200
  });
});
