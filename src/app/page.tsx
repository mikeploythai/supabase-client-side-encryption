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
    const entries = Object.fromEntries(formData.entries());
    const validatedEntries = schema.safeParse(entries);

    if (!validatedEntries.success) {
      for (const issue of validatedEntries.error.issues)
        console.log(issue.message);
      return;
    }

    const entry = await db.user
      .filter(({ email }) => email === validatedEntries.data.email)
      .toArray();

    if (!entry.length) {
      const passwordKey = await getPasswordKey(validatedEntries.data.password);
      const masterKey = await generateMasterKey();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyEncryptionKey = await generateKeyEncryptionKey(
        passwordKey,
        salt,
      );

      if (masterKey.k) {
        setMasterKey(masterKey.k);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedMasterKey = await encryptMasterKey(
          keyEncryptionKey,
          masterKey.k,
          iv,
        );

        if (encryptedMasterKey) {
          setEncryptedMasterKey(new TextDecoder().decode(encryptedMasterKey));

          await db.user.add({
            email: validatedEntries.data.email,
            encryptedMasterKey,
            salt,
            iv,
          });
        }
      }
    } else {
      const encryptedMasterKey = entry[0]?.encryptedMasterKey;
      const salt = entry[0]?.salt;
      const iv = entry[0]?.iv;

      const passwordKey = await getPasswordKey(validatedEntries.data.password);

      if (encryptedMasterKey && salt && iv) {
        setEncryptedMasterKey(new TextDecoder().decode(encryptedMasterKey));

        const keyEncryptionKey = await generateKeyEncryptionKey(
          passwordKey,
          salt,
        );

        const decryptedMasterKey = await decryptMasterKey(
          keyEncryptionKey,
          encryptedMasterKey,
          iv,
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
