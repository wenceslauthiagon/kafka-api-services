import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Test api pix devolutions - list users qrcode', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list pix devolution received', async () => {
    const response = await _cy.get_request(
      env.pix_devolution_received,
      headers,
    );
    const array = [
      'id',
      'state',
      'description',
      'operation_id',
      'type',
      'amount',
      'owner_name',
      'owner_person_type',
      'owner_document',
      'owner_bank_name',
      'beneficiary_name',
      'beneficiary_person_type',
      'beneficiary_document',
      'beneficiary_bank_name',
      'created_at',
    ];
    for (let validation of array) {
      _cy.expect(response, validation);
    }

    file = response.body.data.data;
  });

  it('create json file', async () => {
    await _cy.write_json('pix_devolution', 'pix_devolutions_received', file);
  });
});
