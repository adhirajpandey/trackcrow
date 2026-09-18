import { Button } from "@/components/ui/button";

export function ConsentForm({
  requestId,
  consent,
  scopes,
}: {
  requestId: string;
  consent: string;
  scopes: string[];
}) {
  return (
    <form
      action="/oauth/consent/submit"
      method="post"
      className="mt-6 space-y-5"
    >
      <input type="hidden" name="request" value={requestId} />
      <input type="hidden" name="consent" value={consent} />
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-semibold">
          Choose permissions
        </legend>
        {scopes.map((scope) => (
          <label key={scope} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="scope"
              value={scope}
              defaultChecked={scope === "transactions:read"}
            />
            {scope === "transactions:read"
              ? "Read transactions"
              : "Create and categorize transactions"}
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-muted-foreground">
        You can revoke access in Settings. Access expires after 90 days.
      </p>
      <div className="flex gap-3">
        <Button type="submit" name="decision" value="approve">
          Authorize
        </Button>
        <Button type="submit" name="decision" value="deny" variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
