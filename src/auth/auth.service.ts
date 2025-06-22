import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { KeyService } from './key.service';
import { CompactEncrypt, compactDecrypt, jwtVerify, SignJWT } from 'jose';
import { RefreshTokenPayload } from './auth.types';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { VehicleProfile } from 'src/obd/entities/vehicleProfile.entity';
import { ObdService } from 'src/obd/obd.service';
import { networkInterfaces } from 'os';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly keyService: KeyService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => ObdService))
    private readonly obdService: ObdService,
  ) {}

  async onModuleInit() {
    await this.keyService.loadKeys();
  }

  async generatePairingToken(): Promise<{ token: string }> {
    const { vin, protocol, supportedSensors } =
      this.obdService.getVehicleProfile();

    const signedJWT = await new SignJWT({
      vin,
      protocol,
      supportedSensors,
    })
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

  getLocalIpAddress(): string {
    const interfaces = networkInterfaces();

    for (const iface of Object.values(interfaces)) {
      for (const config of iface || []) {
        if (config.family === 'IPv4' && !config.internal) {
          return config.address;
        }
      }
    }

    throw new Error('No local IP address found');
  }

  createQrCode(): {
    qrCode: { ip: string; port: string; network: string; password: string };
  } {
    const ip = this.getLocalIpAddress();
    const port = this.configService.get('PORT') as string;
    const ssid = this.configService.get('SSID') as string;
    const password = this.configService.get('PASSWORD') as string;
    const qrCode = {
      ip,
      port,
      network: ssid,
      password,
    };

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

  async verifyPairingPayload(pairingPayload: string): Promise<{
    user: User;
    vehicle: VehicleProfile;
  }> {
    let decryptedPayload;
    try {
      const { plaintext } = await compactDecrypt(
        pairingPayload,
        this.keyService.getEncryptionPrivateKey(),
      );
      decryptedPayload = new TextDecoder().decode(plaintext);
    } catch (err) {
      console.error('[❌] Failed to decrypt pairing token:', err);
      throw new UnauthorizedException('Invalid pairing token');
    }

    try {
      const { payload }: any = await jwtVerify(
        decryptedPayload,
        this.keyService.getCloudSigningKey(),
        {
          algorithms: ['RS256'],
        },
      );
      if (!payload || !payload.user || !payload.vehicle) {
        throw new UnauthorizedException('Invalid pairing payload');
      }

      return {
        user: payload.user,
        vehicle: payload.vehicle,
      };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid or expired pairing payload');
    }
  }

  async register(body: {
    carRefreshToken: string;
    payloadData: string;
  }): Promise<{ accessToken: string }> {
    const { carRefreshToken, payloadData } = body;
    const { user: userData, vehicle } =
      await this.verifyPairingPayload(payloadData);

    const user = await this.userRepository.findOne({
      where: { userId: userData.id },
    });

    if (!user) {
      const settings = {
        units: 'imperial',
        language: 'en',
        aiChat: {
          language: 'en',
          voice: 'en-US-Standard-A',
          autoPlay: 'never',
        },
        theme: 'dark',
        dashboard: {
          selectedSensors: ['INTAKE_AIR_TEMPERATURE'],
          refreshRate: 0.5,
          showWarnings: true,
          autoScale: true,
          gaugeSize: 180,
        },
        notifications: {
          enabled: true,
          sound: false,
          vibration: true,
          criticalOnly: false,
        },
        dataLogging: {
          enabled: false,
          interval: 1000,
          maxFileSize: 100,
        },
        display: {
          keepScreenOn: false,
          brightness: 80,
          orientation: 'auto',
        },
      };
      const newUser = this.userRepository.create({
        ...userData,
        userId: userData.id,
        settings,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await this.userRepository.save(newUser);
    }

    await this.obdService.updateVehicleProfile(vehicle);
    const payload = await this.verifyRefreshToken(carRefreshToken);

    const accessToken = await this.issueAccessToken({
      sub: payload.sub,
      carId: payload.carId,
      client: payload.client,
    });
    return { accessToken };
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
      .setExpirationTime(payload.client === 'front' ? '30d' : '7h')
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

  async updateSettings(settings: UpdateSettingsDto): Promise<User['settings']> {
    const user = await this.userRepository.findOne({
      where: { userId: settings.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // await this.userRepository.update(user.id, {
    //   settings: settings.settings,
    // });
    return settings.settings;
  }

  async updateDashboardSettings(
    settings: UpdateSettingsDto,
  ): Promise<User['settings']> {
    const user = await this.userRepository.findOne({
      where: { userId: settings.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.update(user.id, {
      settings: settings.settings,
    });
    return settings.settings;
  }

  async unlink(): Promise<{ message: string }> {
    const user = await this.getUserProfile();
    await this.obdService.unlink();
    await this.userRepository.delete(user.id);
    return { message: 'User unlinked' };
  }
}
