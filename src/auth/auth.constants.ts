import * as path from 'path';

// Base directory for keys - will be different on Windows vs Linux
const KEYS_BASE_DIR =
  process.platform === 'win32'
    ? path.join(process.cwd(), 'keys')
    : '/opt/car/keys';

// TODO: change to /opt/car/keys/signing-private.pem
export const SIGNING_PRIVATE_KEY_PATH = path.join(
  KEYS_BASE_DIR,
  'pi-private.pem',
);
export const ENCRYPTION_PRIVATE_KEY_PATH = path.join(
  KEYS_BASE_DIR,
  'pi-private.pem',
);
export const LOCAL_SIGNING_PRIVATE_KEY_PATH = path.join(
  KEYS_BASE_DIR,
  'pi-private-sign.pem',
);
export const LOCAL_SIGNING_PUBLIC_KEY_PATH = path.join(
  KEYS_BASE_DIR,
  'pi-public-sign.pem',
);
// TODO: change to /opt/car/keys/cloud-pub.pem
export const CLOUD_PUBLIC_ENCRYPTION_KEY_PATH = path.join(
  KEYS_BASE_DIR,
  'cloud-public-encryption.pem',
);
// TODO: change to /opt/car/keys/cloud-sign.pem
export const CLOUD_PUBLIC_SIGNING_KEY_PATH = path.join(
  KEYS_BASE_DIR,
  'cloud-public-signing.pem',
);

export const SIGN_ALG = 'RS256';
export const ENC_ALG = 'RSA-OAEP';
export const ENC_ENC = 'A256GCM';
