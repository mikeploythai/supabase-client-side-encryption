"use client";

import { toast } from "sonner";
import { signOut } from "~/lib/supabase";
import { Button } from "./ui/button";

export default function SignOutButton() {
  async function action() {
    try {
      const res = await signOut();
      if (res.error) throw new Error(res.error.message);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  }

  return (
    <form action={action}>
      <Button type="submit" variant="destructive">
        Sign out
      </Button>
    </form>
  );
}
