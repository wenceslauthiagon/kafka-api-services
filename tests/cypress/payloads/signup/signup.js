export class SignupPayload {
  static body = {
    recaptcha_key: 'recaptcha-app-key',
    recaptcha_token: 'action-token',
    recaptcha_action: 'action-name',
    email: 'james@bond.com',
    name: 'James Bond',
    phone_number: '+5581995657777',
    password: '123456789',
    received_referral_code: '00000',
  };

  static body_confirm = {
    confirmCode: '00000',
  };

}
