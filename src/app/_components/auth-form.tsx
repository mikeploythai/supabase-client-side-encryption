"use client";

import { useRouter } from "next/navigation";
import { forwardRef, type FormHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  encryptMasterKey,
  generateKeyEncryptionKey,
  generateMasterKey,
  getPasswordKey,
} from "~/lib/encrypt";
import { authSchema } from "~/lib/schema";
import { signIn, signUp, uploadKeys } from "~/lib/supabase";
import { type Tables } from "~/lib/supabase/types";
import { Button } from "./ui/button";

interface AuthFormProps extends FormHTMLAttributes<HTMLFormElement> {
  type: "sign_in" | "sign_up";
}

const AuthForm = forwardRef<HTMLFormElement, AuthFormProps>(({ type }, ref) => {
  const router = useRouter();

  async function formAction(formData: FormData) {
    const entries = Object.fromEntries(formData.entries());
    const validatedEntries = authSchema.safeParse(entries);

    if (!validatedEntries.success) {
      for (const issue of validatedEntries.error.issues)
        toast.error(issue.message);
      return;
    }

    if (type === "sign_in") {
      try {
        const res = await signIn(entries);

        if (res.error) throw new Error(res.error.message);

        if (res.data.user) {
          toast.success("Successfully signed in.");
          router.push("/");
        }
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      }
    } else {
      try {
        const res = await signUp(entries);

        if (res.error) throw new Error(res.error.message);
        else if (res.data.user?.identities?.length === 0)
          throw new Error("User with this email already exists.");

        if (res.data.user) {
          toast("Check your email to confirm your account!");

          /**
           * Generate keys
           *
           * This follows Ente's key encryption architecture
           * - Generate a master key
           * - Generate a salt of 16 random bytes
           * - Derive a keyEncryptionKey from the user's password and the salt
           * - Generate an initialization vector/nonce of 12 random bytes
           * - Encrypt the master key with the keyEncryptionKey and nonce
           */
          const passwordKey = await getPasswordKey(
            validatedEntries.data.password,
          );
          const masterKey = await generateMasterKey();
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const keyEncryptionKey = await generateKeyEncryptionKey(
            passwordKey,
            salt,
          );

          if (masterKey.k) {
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

              const payload: Tables<"users"> = {
                id: res.data.user.id,
                encryptedMasterKey: encryptedMasterKey_b64,
                salt: salt_b64,
                iv: iv_b64,
              };

              const { data, error } = await uploadKeys(payload);

              if (error) throw new Error(error.message);
              if (data) return data;
            }
          }
        }
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      }
    }
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-lg *:flex *:flex-col *:gap-1"
    >
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>

        <FormInput type="email" />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>

        <FormInput type="password" />
      </div>

      <FormButton>Sign {type === "sign_in" ? "in" : "up"}</FormButton>
    </form>
  );
});

function FormInput({ type }: { type: "email" | "password" }) {
  const { pending } = useFormStatus();

  return (
    <input
      id={type}
      name={type}
      type={type}
      disabled={pending}
      className="rounded border-slate-200"
    />
  );
}

function FormButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {children}
    </Button>
  );
}

export default AuthForm;
