import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { KeyService } from './key.service';
import * as QRCode from 'qrcode';
import { CompactEncrypt, jwtVerify, SignJWT } from 'jose';
import { RefreshTokenPayload } from './auth.types';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly keyService: KeyService) {}

  async onModuleInit() {
    await this.keyService.loadKeys();
  }

  async generatePairingToken(): Promise<{ token: string; qrCode: string }> {
    const payload = {
      carId: 'pi-xyz-123',
      vin: '1HGCM82633A004352',
      model: 'Toyota Corolla',
    };

    const signedJWT = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(this.keyService.getSigningPrivateKey());

    const encoder = new TextEncoder();
    const token = await new CompactEncrypt(encoder.encode(signedJWT))
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(this.keyService.getCloudEncryptionKey());

    const generateQR = async (text: string) => {
      try {
        return await QRCode.toDataURL(text);
      } catch (err) {
        console.error(err);
      }
    };

    return {
      token,
      qrCode: await generateQR(token),
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload }: any = await jwtVerify(
        token,
        this.keyService.getCloudSigningKey(),
        {
          algorithms: ['RS256'],
        },
      );
      if (!payload || !payload.sub || !payload.carId || !payload.client) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }
      return payload;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async issueAccessToken(payload: {
    sub: string;
    carId: string;
    client: string;
  }): Promise<string> {
    return await new SignJWT({
      sub: payload.sub,
      carId: payload.carId,
      client: payload.client,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime(payload.client === 'front' ? '30d' : '5m')
      .sign(this.keyService.getLocalSigningPrivateKey());
  }

  verifyHmacSignature(
    timestamp: string,
    receivedSignature: string,
    secret: string,
  ): boolean {
    if (!timestamp || !receivedSignature || !secret) {
      return false;
    }
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(timestamp);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    );
  }
}
