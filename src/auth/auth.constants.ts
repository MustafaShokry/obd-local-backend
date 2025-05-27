// TODO: change to /opt/car/keys/signing-private.pem
export const SIGNING_PRIVATE_KEY_PATH = './keys/pi-private.pem';
export const LOCAL_SIGNING_PRIVATE_KEY_PATH = './keys/pi-private-sign.pem';
export const LOCAL_SIGNING_PUBLIC_KEY_PATH = './keys/pi-public-sign.pem';
// TODO: change to /opt/car/keys/cloud-pub.pem
export const CLOUD_PUBLIC_ENCRYPTION_KEY_PATH =
  './keys/cloud-public-encryption.pem';
// TODO: change to /opt/car/keys/cloud-sign.pem
export const CLOUD_PUBLIC_SIGNING_KEY_PATH = './keys/cloud-public-signing.pem';

export const SIGN_ALG = 'RS256';
export const ENC_ALG = 'RSA-OAEP';
export const ENC_ENC = 'A256GCM';
