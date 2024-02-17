import { PaymentInstatBilling as _body } from '../../../payloads/pix_payments/create_payment_qrcode_static';
import { Env, Support as _cy } from '../../../support/support';

describe('TC0033 - Test api pix payments - create payment by qrcode static', () => {
  let env = Env();
  let headers;
  let token;
  let payload = _body.body;
  let id;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('pix_payments', 'id_billing_static');
  });
  it('UC001 - create payment instat billing', async () => {
    let data = _cy.generateData(10);
    let body_ = { ...payload };
    body_.decoded_qr_code_id = id.id;
    body_.payment_date = data;
    const response = await _cy.post_request(
      env.pix_payments_billing_qrcode_static,
      body_,
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'operation_id');
    _cy.expect(response, 'payment_date');
    _cy.expect(response, 'state');
    _cy.expect(response, 'created_at');
  });
});
