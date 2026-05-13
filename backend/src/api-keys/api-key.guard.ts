import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const headers = request['headers'] as Record<string, string | undefined>;
    const authHeader = headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7).trim();
    const apiKey = await this.apiKeysService.validateKey(token);
    if (!apiKey) return false;

    request['apiKey'] = apiKey;
    return true;
  }
}
