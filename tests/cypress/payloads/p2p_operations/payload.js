import { _cy } from '../../support';

export class P2POperationsPayloads {
  static body = {
    pin: '1234',
    destination_wallet_id: '',
    amount_currency: 'BRL',
    amount: _cy.generateNumber(5),
    fee: 19,
    description: `Testing ${_cy.generateString(5)}`,
  };
}
