import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseTransactionMessage } from "@/common/utils";

const requestSchema = z.object({
  data: z.object({
    message: z.string().min(1, "message is required"),
  }),
  metadata: z.object({
    location: z.string().nullable().optional(),
  }),
});


function parseAuthHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const m = headerValue.match(/^Token\s+(\S+)$/i);
  return m ? m[1] : null;
}



export async function POST(req: Request) {
  try {
    const token = parseAuthHeader(req.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.log(token)

    const user = await prisma.user.findFirst({ where: { lt_token: token } });
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.log(user)

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    console.log(json)


    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    console.log(parsed.data)

    const { data, metadata } = parsed.data;
    const details = parseTransactionMessage(data.message);
    console.log(details)
    if (!details.amount || !details.recipient_id) {
      return NextResponse.json(
        {
          message: "Unable to extract required fields from message",
          missing: {
            amount: !details.amount,
            recipient_id: !details.recipient_id,
          },
        },
        { status: 422 },
      );
    }

    const created = await prisma.transaction.create({
      data: {
        uuid: crypto.randomUUID(),
        user_uuid: user.uuid,
        amount: details.amount,
        type: "UPI",
        recipient: details.recipient_id,
        input_mode: "AUTO",
        // Persist current timestamp in UTC
        timestamp: new Date().toISOString(),
        reference: details.reference_number,
        account: "KOTAK", // TODO: extract from message or metadata
        raw_message: data.message,
        location: metadata.location,
      },
      select: { uuid: true, id: true },
    });

    return NextResponse.json({
      message: "Transaction created",
      id: created.id,
      uuid: created.uuid,
    }, { status: 201 });
  } catch (e) {
    console.error("/api/transactions POST error", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
