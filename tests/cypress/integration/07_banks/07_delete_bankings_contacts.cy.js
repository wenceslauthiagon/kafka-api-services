import { Env, Support as _cy } from '../../support/support';
describe('TC039 - Test api banks ted id', () => {
  let env = Env();
  let headers;
  let contacts;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
    headers = await _cy.setCypressEnv(token);
    contacts = await _cy.read_json('banks', 'banks_contacts'); // Assuming this returns the JSON array
  });
  it('UC001 - Delete contacts banking', async () => {
    if (Array.isArray(contacts) && contacts.length > 0) {
      const contact = contacts[0]; // Assuming you want to work with the first contact in the array
      const account = contact.accounts[0];
      const accountId = account.id;
      const response = await _cy.delete_request(
        `${env.banks_delete}${accountId}`,
        { id: accountId },
        headers,
      );
      console.log(response);
      _cy.expect(response, 'success', true);
    } else {
      console.log('Contacts data is missing or empty.');
    }
  });
});
