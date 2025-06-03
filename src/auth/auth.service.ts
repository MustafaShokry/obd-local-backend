import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { KeyService } from './key.service';
import * as QRCode from 'qrcode';
import { CompactEncrypt, jwtVerify, SignJWT } from 'jose';
import { RefreshTokenPayload } from './auth.types';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly keyService: KeyService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.keyService.loadKeys();
  }

  async generatePairingToken(): Promise<{ token: string }> {
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

    return {
      token,
    };
  }

  createQrCode(): { qrCode: string } {
    // const generateQR = async (text: string) => {
    //   try {
    //     const qrCode = (await QRCode.toDataURL(text)) as string;
    //     return qrCode;
    //   } catch (err) {
    //     console.error(err);
    //     throw new Error('QR code generation failed');
    //   }
    // };

    const ip = this.configService.get('HOST') as string;
    const port = this.configService.get('PORT') as string;
    const qrCode = `http://${ip}:${port}/api/auth/pairing-token`;
    // const qrCode = await generateQR(qrCodeData);

    return { qrCode };
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

  async registerUser(userData: RegisterUserDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { userId: userData.userId },
    });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const newUser = this.userRepository.create({
      ...userData,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await this.userRepository.save(newUser);
    return { message: 'User registered successfully' };
  }

  async getUserProfile(): Promise<User> {
    const user: User[] = await this.userRepository.find();
    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }
    return user[0];
  }

  async isUserLoggedIn(): Promise<boolean> {
    const user: User[] = await this.userRepository.find();
    if (user.length === 0) {
      return false;
    }
    return true;
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
