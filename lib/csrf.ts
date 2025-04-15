import { nextCsrf } from "next-csrf";

export const { csrf, setup } = nextCsrf({
  secret: process.env.CSRF_SECRET || "your_super_secret_csrf_key",
});