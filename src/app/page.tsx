"use client";

import { useState } from "react";
import { z } from "zod";
import { db } from "~/db";
import {
  decryptMasterKey,
  encryptMasterKey,
  generateKeyEncryptionKey,
  generateMasterKey,
  getPasswordKey,
} from "~/encrypt";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function HomePage() {
  const [masterKey, setMasterKey] = useState("");
  const [encryptedMasterKey, setEncryptedMasterKey] = useState("");
  const [decryptedMasterKey, setDecryptedMasterKey] = useState("");

  async function action(formData: FormData) {
    // Retrieve and validate form inputs
    const entries = Object.fromEntries(formData.entries());
    const validatedEntries = schema.safeParse(entries);

    if (!validatedEntries.success) {
      for (const issue of validatedEntries.error.issues)
        console.log(issue.message);
      return;
    }

    // Retrieve IndexedDb entry that matches the user
    const entry = await db.user
      .filter(({ email }) => email === validatedEntries.data.email)
      .toArray();

    /**
     * If an entry doesn't exist, create a new one
     *
     * This follows Ente's key encryption architecture
     * - Generate a master key
     * - Generate a salt of 16 random bytes
     * - Derive a keyEncryptionKey from the user's password and the salt
     * - Generate an initialization vector/nonce of 12 random bytes
     * - Encrypt the master key with the keyEncryptionKey and nonce
     */
    if (!entry.length) {
      /**
       * If an entry doesn't exist, create a new one
       *
       * This follow's Ente's key encryption architecture
       * - Generate a master key that'll be used to encrypt various
       *   other keys
       * - Derive a keyEncryptionKey using the user's password and a
       *   generated salt of 16 random bytes
       */
      const passwordKey = await getPasswordKey(validatedEntries.data.password);
      const masterKey = await generateMasterKey();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyEncryptionKey = await generateKeyEncryptionKey(
        passwordKey,
        salt,
      );

      if (masterKey.k) {
        setMasterKey(masterKey.k);

        /**
         * Encrypt the master key using the keyEncryptionKey and
         * an initialization vector/nonce of 12 random bytes
         */
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedMasterKey = await encryptMasterKey(
          keyEncryptionKey,
          masterKey.k,
          iv,
        );

        if (encryptedMasterKey) {
          /**
           * The encrypted master key is encoded into a base64 string, and
           * can now be stored safely in a database. No one can decrypt the
           * key without being able to derive a keyEncryptionKey
           *
           * To ensure users can re-derive their keyEncryptionKey and decrypt the
           * master key on other devices, the keyEncryptionKey salt and encryptedMasterKey
           * nonce are saved to the database as base64 strings too
           *
           * This is safe to do since they're not sensitive secrets, and still requires
           * the user to know the exact password to be able to derive and decrypt
           */
          const encryptedMasterKey_b64 =
            Buffer.from(encryptedMasterKey).toString("base64");
          const salt_b64 = Buffer.from(salt).toString("base64");
          const iv_b64 = Buffer.from(iv).toString("base64");

          setEncryptedMasterKey(encryptedMasterKey_b64);

          await db.user.add({
            email: validatedEntries.data.email,
            encryptedMasterKey: encryptedMasterKey_b64,
            salt: salt_b64,
            iv: iv_b64,
          });
        }
      }
    } else {
      /**
       * If an entry does exist, retrieve the encryptedMasterKey, salt,
       * and nonce from the database, decode them from base64 strings to
       * buffers
       *
       * The decoded salt and user password is used to re-derive the user's
       * keyEncryptionKey, which is then used to decrypt the encryptedMasterKey
       * with the decoded nonce
       */
      const encryptedMasterKey = entry[0]?.encryptedMasterKey;
      const salt = entry[0]?.salt;
      const iv = entry[0]?.iv;

      const passwordKey = await getPasswordKey(validatedEntries.data.password);

      if (encryptedMasterKey && salt && iv) {
        setEncryptedMasterKey(encryptedMasterKey);

        const encryptedMasterKey_decoded = Buffer.from(
          encryptedMasterKey,
          "base64",
        );
        const salt_decoded = Buffer.from(salt, "base64");
        const iv_decoded = Buffer.from(iv, "base64");

        const keyEncryptionKey = await generateKeyEncryptionKey(
          passwordKey,
          salt_decoded,
        );

        const decryptedMasterKey = await decryptMasterKey(
          keyEncryptionKey,
          encryptedMasterKey_decoded,
          iv_decoded,
        );

        if (decryptedMasterKey)
          setDecryptedMasterKey(new TextDecoder().decode(decryptedMasterKey));
      }
    }

    return;
  }

  return (
    <main>
      <form action={action}>
        <input id="email" name="email" className="border" />
        <input id="password" name="password" className="border" />
        <button type="submit">submit</button>
      </form>

      <p>Master Key: {masterKey}</p>
      <p>Encrypted Master Key: {encryptedMasterKey}</p>
      <p>Decrypted Master Key: {decryptedMasterKey}</p>
    </main>
  );
}
