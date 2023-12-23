"use server";

import type { Database, Tables } from "./types";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "~/env";
import { authSchema } from "../schema";

async function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    },
  );
}

async function signUp(data: unknown) {
  const validatedEntries = authSchema.safeParse(data);

  if (!validatedEntries.success) {
    let message = "";

    for (const issue of validatedEntries.error.issues)
      message += issue.message + " ";

    return { error: { message } };
  }

  const { email, password } = validatedEntries.data;
  const supabase = await createSupabaseServerClient();

  return await supabase.auth.signUp({
    email,
    password,
  });
}

async function signIn(data: unknown) {
  const validatedEntries = authSchema.safeParse(data);

  if (!validatedEntries.success) {
    let message = "";

    for (const issue of validatedEntries.error.issues)
      message += issue.message + " ";

    return { error: { message } };
  }

  const { email, password } = validatedEntries.data;
  const supabase = await createSupabaseServerClient();

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

async function signOut() {
  const supabase = await createSupabaseServerClient();

  return await supabase.auth.signOut();
}

async function getSession() {
  const supabase = await createSupabaseServerClient();

  return await supabase.auth.getSession();
}

async function uploadKeys(payload: Tables<"users">) {
  const supabase = await createSupabaseServerClient();

  return await supabase.from("users").insert([payload]);
}

export {
  createSupabaseServerClient,
  getSession,
  signIn,
  signOut,
  signUp,
  uploadKeys,
};
