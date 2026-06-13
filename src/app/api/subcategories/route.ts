import { z } from "zod";

import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import { createSubcategory } from "@/server/modules/categories/mutations";

const subcategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryId: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = subcategorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createSubcategory(sessionData.userUuid, parsed.data);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data, 201);
}
