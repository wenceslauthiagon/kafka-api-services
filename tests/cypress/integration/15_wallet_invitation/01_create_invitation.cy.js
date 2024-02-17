import { WalletsInvitationsPayloads as _payload } from '../../payloads/wallets/payloads';
import { Env, Support as _cy } from '../../support/support';

describe('TC053 - Test api  Wallets invitations', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  let wallet;
  _cy._time(60000);
  let payload = _payload.create;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    wallet = await _cy.read_json(
      'p2p_operations',
      'create_wallet_for_operations',
    );
  });

  it('UC001 - create a new invitation', async () => {
    let body = { ...payload };
    body.wallet_id = wallet.id;
    const response = await _cy.post_request(
      env.wallet_invitation,
      body,
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'wallet_id');
    _cy.expect(response, 'state', 'PENDING');

    file = response.body.data;
  });

  it('create json file', async () => {
    await _cy.write_json(
      'wallet_invitations',
      'create_wallet_invitations',
      file,
    );
  });
  it('UC002 - create a new invitation existent', async () => {
    let body = { ...payload };
    body.wallet_id = wallet.id;
    const response = await _cy.post_request(
      env.wallet_invitation,
      body,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Convite já existe. Verifique seus dados e tente novamente.',
    );
  });
});
