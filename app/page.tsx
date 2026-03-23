import { redirect } from "next/navigation";

export default function Home() {

  const baseUrl = `https://marketplace.gohighlevel.com`;

  const options = {
    requestType: "code",
    redirectUri: `${process.env.DOMAIN}/oauth/callback`,
    clientId: process.env.GHL_CLIENT_ID!,
    scopes: [
      "contacts.readonly",
      "contacts.write",
    ],
  };

  redirect(`${baseUrl}/oauth/chooselocation?response_type=${options.requestType}&redirect_uri=${options.redirectUri}&client_id=${options.clientId}&scope=${options.scopes.join(' ')}`);
}
