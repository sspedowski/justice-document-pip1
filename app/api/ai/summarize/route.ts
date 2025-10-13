import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

interface BodyInput {
  text?: string;
  docId?: string;
  extra?: Record<string, unknown>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1"];

const isProd = () => process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BodyInput;
    const { text = "", docId } = body;

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (text.length > 20000) {
      return NextResponse.json({ error: "Invalid size" }, { status: 400 });
    }

    const [{ verifyIdToken, verifyAppCheck, getDb }, { redact }, { sha256Hex }] =
      await Promise.all([
        import("@/lib/firebaseAdmin"),
        import("@/lib/redact"),
        import("@/lib/hash"),
      ]);

    let uid: string | undefined;
    if (isProd()) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "") || "";
      if (!token) {
        return NextResponse.json(
          { error: "Missing auth token" },
          { status: 401 }
        );
      }
      try {
        uid = (await verifyIdToken(token)).uid;
      } catch {
        return NextResponse.json(
          { error: "Invalid auth token" },
          { status: 401 }
        );
      }
      const appCheckToken = req.headers.get("x-firebase-appcheck") || undefined;
      const appCheckOk = await verifyAppCheck(appCheckToken);
      if (!appCheckOk) {
        return NextResponse.json(
          { error: "Invalid App Check token" },
          { status: 401 }
        );
      }
    }

    const { redacted, summary } = redact(text);

    if (!env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const modelName = env.GEMINI_MODEL;
    const model = genAI.getGenerativeModel({ model: modelName });

    const resp = await model.generateContent([{ text: redacted }]);
    const outputText = resp.response.text();
    const usage = resp.response.usageMetadata || {};
    const tokensUsed =
      (usage as Record<string, unknown>).totalTokens ??
      (usage as Record<string, unknown>).promptTokens ??
      (usage as Record<string, unknown>).candidatesTokens ??
      null;

    try {
      const hashedDocId = sha256Hex(docId || text.slice(0, 256));
      await getDb().collection("ai_logs").add({
        uid: uid || null,
        ts: Date.now(),
        model: modelName,
        hashedDocId,
        redactionSummary: summary,
        promptChars: text.length,
        outputChars: outputText.length,
        env: process.env.NODE_ENV,
      });
    } catch (error) {
      console.error("Failed to log ai_logs:", error);
    }

    return NextResponse.json({ outputText, tokensUsed, model: modelName });
  } catch (error) {
    console.error("AI summarize error", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
