import { GoogleSignInButton } from "@/components/product/google-sign-in-button";
import { BrandMark } from "@/components/product/brand-mark";
import { getOAuthConsentPageData } from "@/server/page-data/oauth-consent";
import { ConsentForm } from "./consent-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Authorize access | TrackCrow",
  robots: { index: false, follow: false },
  referrer: "same-origin" as const,
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request: requestId } = await searchParams;
  const consent = await getOAuthConsentPageData(requestId ?? "");
  if (!consent)
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">
          Authorization request expired or invalid
        </h1>
        <p className="mt-4">Return to your MCP client and connect again.</p>
      </main>
    );
  return (
    <main className="mx-auto my-12 max-w-lg border bg-card p-8">
      <BrandMark />
      <h1 className="mt-6 text-2xl font-bold">
        {consent.clientName} wants access to TrackCrow
      </h1>
      <p className="mt-2 break-all text-sm text-muted-foreground">
        {consent.clientDomain}
      </p>
      {consent.sealedConsent ? (
        <>
          <p className="mt-4 text-sm">Signed in as {consent.userLabel}</p>
          <ConsentForm
            requestId={consent.requestId}
            consent={consent.sealedConsent}
            scopes={consent.scopes}
          />
        </>
      ) : (
        <>
          <p className="my-6 text-sm">
            Sign in to choose which permissions to allow.
          </p>
          <GoogleSignInButton
            callbackUrl={`/oauth/consent?request=${consent.requestId}`}
            variant="default"
          >
            Continue with Google
          </GoogleSignInButton>
        </>
      )}
    </main>
  );
}
