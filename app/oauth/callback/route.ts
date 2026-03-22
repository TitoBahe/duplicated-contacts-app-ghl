import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // Troca o authorization code por um access token
  const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID!,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `https://${process.env.DOMAIN}/oauth/callback`,
    }),
  });

  const tokenData: {
    access_token: string, 
    expires_in: number, 
    refresh_token: string,
    companyId : string
  } = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Failed to exchange token", details: tokenData }, { status: 500 });
  }

  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in;
  const refreshToken = tokenData.refresh_token;
  const companyId = tokenData.companyId;
  const expires_at = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Salva no banco
  await db.query(
    `INSERT INTO locations (location_id, access_token, refresh_token, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (location_id) DO UPDATE SET
       access_token = $2, refresh_token = $3, expires_at = $4`,
    [companyId, accessToken, refreshToken, expires_at]
  );

  return NextResponse.json({ message: "SAVED" });
}
