import { NextRequest, NextResponse } from "next/server";

const cookieName = "restaurante_visita";
const reads = new Set(["menu", "status", "bill", "kitchen"]);
const writes = new Set(["join", "orders", "call", "pay", "preferences", "feedback", "fire", "substitution"]);
const noCache = { "Cache-Control": "no-store" };

async function forward(request: NextRequest, operation: string) {
  const post = request.method === "POST";
  if (!(post ? writes : reads).has(operation)) return new NextResponse(null, { status: 404 });
  if (post) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const allowedOrigin = host && ["http:", "https:"].some((protocol) => origin === `${protocol}//${host}`);
    if (!allowedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Solicitud no autorizada." }, { status: 403, headers: noCache });
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json({ error: "Formato de solicitud inválido." }, { status: 415, headers: noCache });
    }
  }

  const api = process.env.NEXT_PUBLIC_API_URL2;
  if (!api) return NextResponse.json({ error: "El servicio de mesa no está disponible." }, { status: 503, headers: noCache });
  const body = post ? await request.text() : undefined;
  if (body && Buffer.byteLength(body) > 64_000) {
    return NextResponse.json({ error: "El pedido es demasiado grande." }, { status: 413, headers: noCache });
  }
  const headers = new Headers({ "Content-Type": "application/json" });
  const guest = request.cookies.get(cookieName)?.value;
  if (guest) headers.set("X-Dining-Token", guest);

  try {
    const upstream = await fetch(`${api.replace(/\/$/, "")}/dining/${operation}`, {
      method: request.method, body, headers, cache: "no-store", signal: AbortSignal.timeout(12_000),
    });
    const payload = await upstream.json();
    if (operation !== "join" || !upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status, headers: noCache });
    }
    if (typeof payload.guestToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(payload.guestToken)) {
      throw new Error("Invalid dining API response");
    }
    const response = NextResponse.json({ joined: true }, { headers: noCache });
    response.cookies.set(cookieName, payload.guestToken, {
      httpOnly: true, sameSite: "lax", path: "/api/mesa",
      secure: request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
      maxAge: 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Perdimos la conexión. Volvé a intentar." }, { status: 503, headers: noCache });
  }
}

type Context = { params: Promise<{ operation: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  return forward(request, (await params).operation);
}

export async function POST(request: NextRequest, { params }: Context) {
  return forward(request, (await params).operation);
}
