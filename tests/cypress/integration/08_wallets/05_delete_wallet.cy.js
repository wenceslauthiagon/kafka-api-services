import { Env, Support as _cy } from '../../support/support';

describe('TC043 - Test api  Wallets', () => {
  let env = Env();
  let headers;
  let token;
  let wallet;
  let wallet_list;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    wallet = await _cy.read_json('wallets', 'create_wallet');
  });
  let invitation;

  it('UC001 - delete a new wallet', async () => {
    const response = await _cy.delete_request(
      `${env.wallets}/${wallet.id}`,
      {
        wallet_backup_id: wallet.id,
      },
      headers,
    );
    _cy.expect(response, 'success', true);
  });
  it('stop delete file json with id invitation', async () => {
    invitation = await _cy.read_json(
      'p2p_operations',
      'create_wallet_for_operations',
    );
  });

  it('UC002 - delete a new wallet list ', async () => {
    wallet_list = await _cy.read_json('wallets', 'list_wallets');

    for (let delete_wallts of wallet_list) {
      if (wallet_list.length > 3 && delete_wallts.id !== invitation.id) {
        await _cy.delete_request(
          `${env.wallets}/${delete_wallts.id}`,
          {
            wallet_backup_id: delete_wallts.id,
          },
          headers,
        );
      }
    }
  });

  it('TIME - time wait delete wallet', async () => {
    await new Promise((resolve) => setTimeout(resolve, 60000));
  });
});
