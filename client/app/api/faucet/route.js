import { NextResponse } from "next/server";
import { runFaucet } from "../../../lib/server/faucet";

const inFlight = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const recipientAddress = String(body?.address || "").toLowerCase();

    if (!inFlight.has(recipientAddress)) {
      inFlight.set(
        recipientAddress,
        runFaucet(recipientAddress).finally(() => {
          inFlight.delete(recipientAddress);
        }),
      );
    }

    const result = await inFlight.get(recipientAddress);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || error) },
      { status: 400 },
    );
  }
}
