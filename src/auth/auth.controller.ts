import {
  Controller,
  Get,
  Post,
  Body,
  UnauthorizedException,
  Res,
  Headers,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User } from './entities/user.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('pairing-token')
  async getPairingToken(): Promise<{ token: string }> {
    return this.authService.generatePairingToken();
  }

  @Get('qr-code')
  getQrCode(): {
    qrCode: { ip: string; port: string; network: string; password: string };
  } {
    return this.authService.createQrCode();
  }

  @Post('register')
  async register(
    @Body() body: { carRefreshToken: string; payloadData: string },
  ): Promise<{ accessToken: string }> {
    return this.authService.register(body);
  }

  @Get('me')
  async getUserProfile(): Promise<User> {
    return this.authService.getUserProfile();
  }

  @Get('is-logged-in')
  async isUserLoggedIn(): Promise<boolean> {
    return this.authService.isUserLoggedIn();
  }

  @Patch('me/settings')
  async updateSettings(
    @Body() settings: UpdateSettingsDto,
  ): Promise<User['settings']> {
    return this.authService.updateSettings(settings);
  }
  @Patch('me/settings/dashboard')
  async updateDashboardSettings(
    @Body() settings: UpdateSettingsDto,
  ): Promise<User['settings']> {
    return this.authService.updateDashboardSettings(settings);
  }

  @Post('refresh')
  async refreshAccessToken(
    @Body() body: { refreshToken: string },
  ): Promise<{ accessToken: string }> {
    const payload = await this.authService.verifyRefreshToken(
      body.refreshToken,
    );

    const accessToken = await this.authService.issueAccessToken({
      sub: payload.sub,
      carId: payload.carId,
      client: payload.client,
    });

    return { accessToken };
  }

  @Post('front-access-token')
  async getFrontAccessToken(
    @Headers('x-timestamp') timestamp: string,
    @Headers('x-signature') signature: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const isValid = this.authService.verifyHmacSignature(
      timestamp,
      signature,
      this.configService.get('FRONT_SECRET') || '',
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    const isUserLoggedIn = await this.authService.isUserLoggedIn();
    if (!isUserLoggedIn) {
      throw new UnauthorizedException('User not logged in');
    }

    const accessToken = await this.authService.issueAccessToken({
      sub: 'front',
      carId: 'front',
      client: 'front',
    });

    res.cookie('front-token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return { message: 'front authenticated' };
  }

  @Delete('unlink')
  async unlink(): Promise<{ message: string }> {
    return this.authService.unlink();
  }
}
