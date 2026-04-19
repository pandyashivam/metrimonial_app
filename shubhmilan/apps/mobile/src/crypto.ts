/**
 * End-to-end encryption for chat messages.
 *
 *   • Keypair: Curve25519 (nacl.box)
 *   • Private key: stored in SecureStore (iOS Keychain / Android Keystore). Never leaves device.
 *   • Public key: uploaded to the server so peers can encrypt messages to us.
 *   • Each message: sender does nacl.box(plaintext, nonce, peerPublicKey, senderSecretKey).
 *     Both parties can decrypt using nacl.box.open(ciphertext, nonce, otherPublicKey, mySecret).
 *   • Server stores only base64 ciphertext + nonce. It can't read plaintext.
 *
 * Note: switching devices generates a new keypair → old threads unreadable on the new device.
 *       That's intentional and well-scoped; a future enhancement is key backup with a user
 *       passphrase (or Signal-style PFS with ratchet). Out of scope for this pass.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const SECRET_KEY_STORAGE = 'shubhmilan.chat.secretKey';
const PUBLIC_KEY_STORAGE = 'shubhmilan.chat.publicKey';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

/** Generate 24 cryptographically-strong random bytes for a nonce. */
export async function randomNonce(): Promise<Uint8Array> {
  const bytes = await Crypto.getRandomBytesAsync(24);
  return new Uint8Array(bytes);
}

/** Produce a new Curve25519 keypair. Both values returned as base64 strings. */
export async function generateKeyPair(): Promise<KeyPair> {
  const seed = await Crypto.getRandomBytesAsync(32);
  const kp = nacl.box.keyPair.fromSecretKey(new Uint8Array(seed));
  return {
    publicKey: naclUtil.encodeBase64(kp.publicKey),
    secretKey: naclUtil.encodeBase64(kp.secretKey),
  };
}

/** Ensure a keypair exists on this device, creating one on first use. */
export async function ensureKeyPair(): Promise<KeyPair> {
  const existingSecret = await SecureStore.getItemAsync(SECRET_KEY_STORAGE);
  const existingPublic = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
  if (existingSecret && existingPublic) {
    return { secretKey: existingSecret, publicKey: existingPublic };
  }
  const kp = await generateKeyPair();
  await SecureStore.setItemAsync(SECRET_KEY_STORAGE, kp.secretKey);
  await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE, kp.publicKey);
  return kp;
}

export async function getMyKeyPair(): Promise<KeyPair | null> {
  const secret = await SecureStore.getItemAsync(SECRET_KEY_STORAGE);
  const pub = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
  if (!secret || !pub) return null;
  return { secretKey: secret, publicKey: pub };
}

export async function clearKeyPair() {
  await SecureStore.deleteItemAsync(SECRET_KEY_STORAGE);
  await SecureStore.deleteItemAsync(PUBLIC_KEY_STORAGE);
}

/** Encrypt a UTF-8 string for a peer. Returns base64 ciphertext + nonce. */
export async function encryptMessage(
  plaintext: string,
  peerPublicKeyB64: string,
  mySecretKeyB64: string,
): Promise<{ ciphertext: string; nonce: string }> {
  const nonce = await randomNonce();
  const box = nacl.box(
    naclUtil.decodeUTF8(plaintext),
    nonce,
    naclUtil.decodeBase64(peerPublicKeyB64),
    naclUtil.decodeBase64(mySecretKeyB64),
  );
  return {
    ciphertext: naclUtil.encodeBase64(box),
    nonce: naclUtil.encodeBase64(nonce),
  };
}

/** Decrypt a peer's ciphertext into a UTF-8 string. Returns null on failure. */
export function decryptMessage(
  ciphertextB64: string,
  nonceB64: string,
  peerPublicKeyB64: string,
  mySecretKeyB64: string,
): string | null {
  try {
    const out = nacl.box.open(
      naclUtil.decodeBase64(ciphertextB64),
      naclUtil.decodeBase64(nonceB64),
      naclUtil.decodeBase64(peerPublicKeyB64),
      naclUtil.decodeBase64(mySecretKeyB64),
    );
    if (!out) return null;
    return naclUtil.encodeUTF8(out);
  } catch {
    return null;
  }
}
