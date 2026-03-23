import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID!,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.DOMAIN}/oauth/callback`,
    }),
  });

  const tokenData: {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    companyId: string;
  } = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Failed to exchange token", details: tokenData }, { status: 500 });
  }

  const expires_at = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const { error } = await db
    .from("locations")
    .upsert({
      location_id: tokenData.companyId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at,
    }, { onConflict: "location_id" });

  if (error) {
    return NextResponse.json({ error: "Failed to save token", details: error }, { status: 500 });
  }

  return NextResponse.json({ message: "SAVED" });
}