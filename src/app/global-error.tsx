"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#0a0a0a",
            color: "#ffffff",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <section
            style={{
              maxWidth: 560,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              padding: 32,
            }}
          >
            <p
              style={{
                color: "#faff69",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              TrackCrow
            </p>
            <h1 style={{ marginTop: 16, fontSize: 32, lineHeight: 1.1 }}>
              Something went wrong.
            </h1>
            <p style={{ marginTop: 12, color: "#cccccc", lineHeight: 1.6 }}>
              Retry the page. Internal error details are hidden from this final
              fallback.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                minHeight: 40,
                border: 0,
                borderRadius: 8,
                background: "#faff69",
                color: "#0a0a0a",
                padding: "0 20px",
                fontWeight: 700,
              }}
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
