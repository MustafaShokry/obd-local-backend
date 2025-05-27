export interface PairingTokenPayload {
  carId: string;
  vin: string;
  model: string;
  issuedAt: number;
  expiresAt: number;
}

export interface RefreshTokenPayload {
  sub: string;
  carId: string;
  client: string;
}
