import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getPhonePeAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  console.log("this is from phonepe auth", now);
  if (cachedToken && tokenExpiry && now < tokenExpiry - 60) { 
    return cachedToken;
  }

  const url = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
  const params = new URLSearchParams();
  params.append("client_id", process.env.PHONEPE_CLIENT_ID!);
  params.append("client_secret", process.env.PHONEPE_CLIENT_SECRET!);
  params.append("client_version", "1");
  params.append("grant_type", "client_credentials");

  const response = await axios.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token, expires_at } = response.data;
  console.log("PhonePe access_token:", access_token);
  cachedToken = access_token;
  tokenExpiry = expires_at;
  return access_token;
}