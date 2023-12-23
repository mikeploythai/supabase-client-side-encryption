import AuthForm from "~/app/_components/auth-form";
import ExternalLink from "~/app/_components/external-link";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/app/_components/ui/tabs";

export default function Auth() {
  return (
    <main className="w-full max-w-screen-sm p-8">
      <Tabs defaultValue="sign_in" className="w-full space-y-2">
        <TabsList>
          <TabsTrigger value="sign_in">Sign in</TabsTrigger>
          <TabsTrigger value="sign_up">Sign up</TabsTrigger>
        </TabsList>

        <TabsContent value="sign_in" className="rounded-lg" asChild>
          <AuthForm type="sign_in" />
        </TabsContent>

        <TabsContent value="sign_up" className="space-y-4 rounded-lg">
          <AuthForm type="sign_up" />

          <p className="text-center text-sm font-medium text-slate-500">
            We encourage you to use a password manager such as{" "}
            <ExternalLink href="https://bitwarden.com">Bitwarden</ExternalLink>{" "}
            or{" "}
            <ExternalLink href="https://proton.me/pass">
              Proton Pass
            </ExternalLink>{" "}
            to save your credentials.
          </p>
        </TabsContent>
      </Tabs>
    </main>
  );
}
