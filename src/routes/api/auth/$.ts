/**
 * Better Auth HTTP handler — all `/api/auth/*` traffic (email sign-up/sign-in,
 * session, OAuth callbacks) lands here.
 *
 * Without this route the client posts to `/api/auth/sign-up/email` and gets 404.
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        return auth.handler(request);
      },
    },
  },
});
