// src/common/guards/rate-limiting.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitingGuard extends ThrottlerGuard {
  protected errorMessage = 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.';
}
