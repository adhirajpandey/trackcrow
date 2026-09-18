"use client";

import { toast } from "sonner";
import { useConnectionsQuery } from "@/features/oauth/queries";
import { useRevokeConnectionMutation } from "@/features/oauth/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : "Never";

export function ConnectedApps() {
  const connections = useConnectionsQuery();
  const revoke = useRevokeConnectionMutation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Apps</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage apps authorized through your TrackCrow account.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.isPending && <p role="status">Loading connected apps…</p>}
        {connections.isError && (
          <div role="alert">
            <p>Could not load connected apps.</p>
            <Button
              variant="secondary"
              onClick={() => void connections.refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {connections.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No connected apps yet. Connect from an MCP client to authorize
            access.
          </p>
        )}
        {connections.data?.map((connection) => {
          const inactive =
            Boolean(connection.revokedAt) ||
            new Date(connection.expiresAt).getTime() <= connections.dataUpdatedAt;
          return (
            <div
              key={connection.uuid}
              className="space-y-2 rounded-md border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{connection.clientName}</h3>
                  <p className="break-all text-sm text-muted-foreground">
                    {new URL(connection.clientId).hostname}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={inactive || revoke.isPending}
                  onClick={() =>
                    revoke.mutate(connection.uuid, {
                      onSuccess: () => toast.success("Access revoked"),
                      onError: () => toast.error("Could not revoke access"),
                    })
                  }
                >
                  {connection.revokedAt
                    ? "Revoked"
                    : inactive
                      ? "Expired"
                      : "Revoke access"}
                </Button>
              </div>
              <p className="text-sm">
                {connection.scopes
                  .map((scope) =>
                    scope === "TRANSACTIONS_READ"
                      ? "Read transactions"
                      : "Create and categorize transactions",
                  )
                  .join(" · ")}
              </p>
              <p className="text-xs text-muted-foreground">
                Connected {date(connection.createdAt)} · Last used{" "}
                {date(connection.lastUsedAt)} · Expires{" "}
                {date(connection.expiresAt)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
