import {
  Controller,
  Get,
  Post,
  Body,
  UnauthorizedException,
  Res,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('pairing-token')
  async getPairingToken(): Promise<{ token: string; qrCode: string }> {
    return this.authService.generatePairingToken();
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
}
