import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseTransactionMessage } from "@/common/sms-parser";
import { logger } from "@/lib/logger";

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
    logger.info("POST /api/transactions/sms - Starting SMS transaction processing");
    
    const token = parseAuthHeader(req.headers.get("authorization"));
    if (!token) {
      logger.info("POST /api/transactions/sms - Missing or invalid authorization token");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { lt_token: token } });
    if (!user) {
      logger.info("POST /api/transactions/sms - User not found for token");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    logger.debug("POST /api/transactions/sms - User authenticated", {
      userUuid: user.uuid,
      userEmail: user.email
    });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      logger.error("POST /api/transactions/sms - Invalid JSON body", undefined, {
        userUuid: user.uuid
      });
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      logger.error("POST /api/transactions/sms - Invalid payload", undefined, {
        userUuid: user.uuid,
        validationErrors: parsed.error.issues
      });
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { data, metadata } = parsed.data;
    const details = parseTransactionMessage(data.message);
    
    logger.debug("POST /api/transactions/sms - SMS parsing result", {
      userUuid: user.uuid,
      originalMessage: data.message,
      parsedDetails: details,
      location: metadata.location
    });
    
    if (!details || !details.amount || !details.recipient) {
      logger.error("POST /api/transactions/sms - Unable to parse SMS message", undefined, {
        userUuid: user.uuid,
        originalMessage: data.message,
        parsedDetails: details,
        missing: {
          amount: !details?.amount,
          recipient: !details?.recipient,
        }
      });
      return NextResponse.json(
        {
          message: "Unable to extract required fields from message",
          missing: {
            amount: !details?.amount,
            recipient: !details?.recipient,
          },
          parsedDetails: details,
          originalMessage: data.message,
        },
        { status: 422 },
      );
    }

    const created = await prisma.transaction.create({
      data: {
        uuid: crypto.randomUUID(),
        user_uuid: user.uuid,
        amount: details.amount,
        type: details.type,
        recipient: details.recipient,
        input_mode: "AUTO",
        // Persist current timestamp in UTC
        timestamp: new Date().toISOString(),
        reference: details.reference,
        account: details.account,
        raw_message: data.message,
        location: metadata.location,
      },
      select: { uuid: true, id: true },
    });

    logger.info("POST /api/transactions/sms - Transaction created successfully", {
      userUuid: user.uuid,
      transactionId: created.id,
      transactionUuid: created.uuid,
      amount: details.amount,
      recipient: details.recipient,
      type: details.type
    });

    return NextResponse.json({
      message: "Transaction created",
      id: created.id,
      uuid: created.uuid,
    }, { status: 201 });
  } catch (e) {
    logger.error("POST /api/transactions/sms - Unexpected error", e as Error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
