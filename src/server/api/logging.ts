import { logger, createRequestContext, withRequestContext } from "@/lib/logger";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext
) => Response | Promise<Response>;

function buildRoutePath(request: Request) {
  return new URL(request.url).pathname;
}

function getRequestId(request: Request) {
  return request.headers.get("x-request-id")?.trim() || undefined;
}

function getSuccessLogLevel(method: string) {
  return method === "GET" ? "debug" : "info";
}

function getResponseLogLevel(method: string, status: number) {
  if (status >= 500) {
    return "error";
  }

  if (status >= 400) {
    return "warn";
  }

  return getSuccessLogLevel(method);
}

function logRouteEvent(
  level: "debug" | "info" | "warn" | "error",
  entry: {
    event: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
  }
) {
  if (level === "error") {
    logger.error(entry);
    return;
  }

  if (level === "warn") {
    logger.warn(entry);
    return;
  }

  if (level === "info") {
    logger.info(entry);
    return;
  }

  logger.debug(entry);
}

export function logInvalidJson(path: string) {
  logger.warn({
    event: "request.invalid_json",
    path,
    message: "Invalid JSON request body",
  });
}

export function logValidationFailure(path: string, issues: Array<{ path?: PropertyKey[] }>) {
  logger.warn({
    event: "request.validation_failed",
    path,
    issueCount: issues.length,
    issuePaths: issues.map((issue) =>
      Array.isArray(issue.path) ? issue.path.map((segment) => String(segment)).join(".") : ""
    ),
    message: "Request validation failed",
  });
}

export function withRouteLogging<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async function loggedRouteHandler(request: Request, context: TContext) {
    const method = request.method.toUpperCase();
    const path = buildRoutePath(request);
    const requestContext = createRequestContext({
      requestId: getRequestId(request),
      method,
      path,
    });

    return withRequestContext(requestContext, async () => {
      const startedAt = Date.now();

      logger.debug({
        event: "request.started",
        method,
        path,
      });

      try {
        const response = await handler(request, context);
        response.headers.set("x-request-id", requestContext.requestId);

        logRouteEvent(getResponseLogLevel(method, response.status), {
          event: "request.completed",
          method,
          path,
          status: response.status,
          durationMs: Date.now() - startedAt,
        });

        return response;
      } catch (error) {
        logger.error(
          {
            event: "request.failed",
            method,
            path,
            status: 500,
            durationMs: Date.now() - startedAt,
          },
          error
        );
        throw error;
      }
    });
  };
}
