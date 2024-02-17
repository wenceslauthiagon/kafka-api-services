import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CloudflareThrottlerGuard extends ThrottlerGuard {
  getTracker(req) {
    return req.headers['cf-connecting-ip'] ?? req.ip;
  }
}
