async function getPasswordKey(password: string) {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
}

async function generateMasterKey() {
  return await crypto.subtle
    .generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
    .then(async (key) => {
      return await crypto.subtle.exportKey("jwk", key);
    });
}

async function generateKeyEncryptionKey(
  passwordKey: CryptoKey,
  salt: Uint8Array,
) {
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 1000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function encryptMasterKey(
  keyEncryptionKey: CryptoKey,
  masterKey: string,
  iv: Uint8Array,
) {
  return await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyEncryptionKey,
    new TextEncoder().encode(masterKey),
  );
}

async function decryptMasterKey(
  keyEncryptionKey: CryptoKey,
  encryptedMasterKey: ArrayBuffer,
  iv: Uint8Array,
) {
  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keyEncryptionKey,
    encryptedMasterKey,
  );
}

export {
  decryptMasterKey,
  encryptMasterKey,
  generateKeyEncryptionKey,
  generateMasterKey,
  getPasswordKey,
};
