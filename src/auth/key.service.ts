import * as fs from 'fs/promises';
import { importPKCS8, importSPKI, KeyObject } from 'jose';
import { Injectable } from '@nestjs/common';
import {
  SIGNING_PRIVATE_KEY_PATH,
  CLOUD_PUBLIC_ENCRYPTION_KEY_PATH,
  CLOUD_PUBLIC_SIGNING_KEY_PATH,
  LOCAL_SIGNING_PRIVATE_KEY_PATH,
  LOCAL_SIGNING_PUBLIC_KEY_PATH,
  ENCRYPTION_PRIVATE_KEY_PATH,
} from './auth.constants';

@Injectable()
export class KeyService {
  private signingPrivateKey: KeyObject;
  private cloudEncryptionKey: KeyObject;
  private cloudSigningKey: KeyObject;
  private localSigningPrivateKey: KeyObject;
  private localSigningPublicKey: KeyObject;
  private encryptionPrivateKey: KeyObject;

  async loadKeys() {
    const [
      signingPem,
      cloudPem,
      cloudSigningPem,
      localSigningPem,
      localSigningPublicKeyPem,
      encryptionPem,
    ] = await Promise.all([
      fs.readFile(SIGNING_PRIVATE_KEY_PATH, 'utf-8'),
      fs.readFile(CLOUD_PUBLIC_ENCRYPTION_KEY_PATH, 'utf-8'),
      fs.readFile(CLOUD_PUBLIC_SIGNING_KEY_PATH, 'utf-8'),
      fs.readFile(LOCAL_SIGNING_PRIVATE_KEY_PATH, 'utf-8'),
      fs.readFile(LOCAL_SIGNING_PUBLIC_KEY_PATH, 'utf-8'),
      fs.readFile(ENCRYPTION_PRIVATE_KEY_PATH, 'utf-8'),
    ]);

    this.signingPrivateKey = await importPKCS8(signingPem, 'RS256');
    this.cloudEncryptionKey = await importSPKI(cloudPem, 'RSA-OAEP-256');
    this.cloudSigningKey = await importSPKI(cloudSigningPem, 'RS256');
    this.localSigningPrivateKey = await importPKCS8(localSigningPem, 'RS256');
    this.localSigningPublicKey = await importSPKI(
      localSigningPublicKeyPem,
      'RS256',
    );
    this.encryptionPrivateKey = await importPKCS8(
      encryptionPem,
      'RSA-OAEP-256',
    );
  }

  getSigningPrivateKey(): KeyObject {
    return this.signingPrivateKey;
  }

  getCloudEncryptionKey(): KeyObject {
    return this.cloudEncryptionKey;
  }

  getCloudSigningKey(): KeyObject {
    return this.cloudSigningKey;
  }

  getLocalSigningPrivateKey(): KeyObject {
    return this.localSigningPrivateKey;
  }

  getLocalSigningPublicKey(): KeyObject {
    return this.localSigningPublicKey;
  }

  getEncryptionPrivateKey(): KeyObject {
    return this.encryptionPrivateKey;
  }
}
