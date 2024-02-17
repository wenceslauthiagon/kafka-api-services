export class ComplianceLimitRequest {
  static body = {
    user_limit_id: null,
    request_yearly_limit: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_monthly_limit: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_daily_limit: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_nightly_limit: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_max_amount: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_min_amount: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_max_amount_nightly:
      Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
    request_min_amount_nightly:
      Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
  };
}
