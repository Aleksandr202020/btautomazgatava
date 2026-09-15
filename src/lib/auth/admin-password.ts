/**
 * Admin-only password reset for local email/password accounts.
 * Uses Better Auth password hasher so the new hash matches sign-in.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function pinOk(pin: string): boolean {
  if (typeof process === "undefined") return false;
  const raw = process.env["BTA_ADMIN_PIN"];
  const adminPin = typeof raw === "string" ? raw.trim() : "";
  return adminPin.length > 0 && pin === adminPin;
}

export const adminResetUserPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        pin: z.string().min(1),
        email: z.string().trim().email().max(120),
        newPassword: z.string().min(8).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, error: "pin" as const };

    const email = data.email.trim().toLowerCase();
    try {
      const { auth } = await import("@/lib/auth/server");
      const ctx = await auth.$context;

      const user = await ctx.adapter.findOne({
        model: "user",
        where: [{ field: "email", value: email }],
      });
      if (!user || typeof user !== "object" || !("id" in user)) {
        return { ok: false as const, error: "not_found" as const };
      }
      const userId = String((user as { id: string }).id);

      const hash = await ctx.password.hash(data.newPassword);

      const accounts = await ctx.adapter.findMany({
        model: "account",
        where: [{ field: "userId", value: userId }],
      });
      const list = Array.isArray(accounts) ? accounts : [];
      const cred = list.find(
        (a) => a && typeof a === "object" && (a as { providerId?: string }).providerId === "credential",
      ) as { id?: string } | undefined;

      if (cred?.id) {
        await ctx.adapter.update({
          model: "account",
          where: [{ field: "id", value: cred.id }],
          update: { password: hash },
        });
      } else {
        // User exists (e.g. OAuth-only) — create credential account so email login works
        await ctx.adapter.create({
          model: "account",
          data: {
            userId,
            accountId: userId,
            providerId: "credential",
            password: hash,
          },
        });
      }

      return { ok: true as const };
    } catch (err) {
      console.error("[auth] adminResetUserPassword", err);
      return { ok: false as const, error: "generic" as const };
    }
  });
