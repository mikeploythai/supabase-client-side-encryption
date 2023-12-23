import { getSession } from "~/lib/supabase";
import AccountConfirmedToast from "../_components/account-confirmed-toast";
import SignOutButton from "../_components/sign-out-button";

export default async function Home() {
  const { data } = await getSession();
  if (!data.session) return <h1>Not logged in</h1>;

  return (
    <>
      <h1>{data.session.user.email}</h1>
      <SignOutButton />
      <AccountConfirmedToast />
    </>
  );
}
