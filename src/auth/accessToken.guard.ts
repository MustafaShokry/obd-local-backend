import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify } from 'jose';
import { KeyService } from './key.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly keyService: KeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    const frontToken = req.cookies['front-token'];

    if (!authHeader?.startsWith('Bearer ') && !frontToken) return false;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : frontToken;

    try {
      const { payload }: any = await jwtVerify(
        token,
        this.keyService.getLocalSigningPublicKey(),
      );
      req.user = payload;
      return true;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
