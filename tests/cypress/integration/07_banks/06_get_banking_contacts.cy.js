import { Env, Support as _cy } from '../../support/support';

describe('TC038 - Test api banks ted id', () => {
  let env = Env();
  let headers;
  let file;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - List the banking contacts.', async () => {
    const response = await _cy.get_request(env.banks_contacts, headers);
    const array = [
      'id',
      'name',
      'document',
      'document_type',
      'created_at',
      'accounts',
      'account_digit',
      'account_number',
      'account_type',
      'bank_code',
      'bank_name',
      'branch_number',
      'created_at',
    ];
    for (let validation of array) {
      _cy.expect(response, validation);
    }

    file = response.body.data.data;
  });

  it('create json file', async () => {
    await _cy.write_json('banks', 'banks_contacts', file);
  });
});
