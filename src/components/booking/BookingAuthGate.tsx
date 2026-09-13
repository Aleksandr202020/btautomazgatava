import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { authEnabled } from "@/lib/auth/client";
import { SignInButtons } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

type Props = {
  embedded?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
};

/** Blocks booking UI until the visitor is signed in (when auth is enabled). */
export function BookingAuthGate({ embedded, onClose, children }: Props) {
  const { t } = useLang();
  const { user, isPending } = useCurrentUserState();

  if (!authEnabled) return <>{children}</>;

  if (isPending) {
    return (
      <div className={cn("flex h-full flex-col bg-bg text-fg", embedded && "min-h-[70dvh]")}>
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("navBook")}</p>
          {onClose ? (
            <button type="button" className="size-11 rounded-md" aria-label={t("close")} onClick={onClose}>
              <X className="mx-auto size-5" />
            </button>
          ) : null}
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-12 text-muted">…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("flex h-full flex-col bg-bg text-fg", embedded && "min-h-[70dvh]")}>
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("signInTitle")}</p>
          {onClose ? (
            <button type="button" className="size-11 rounded-md" aria-label={t("close")} onClick={onClose}>
              <X className="mx-auto size-5" />
            </button>
          ) : null}
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
          <h2 className="font-display text-3xl">{t("signInTitle")}</h2>
          <p className="max-w-sm text-sm text-muted">{t("bookingRequireAuth")}</p>
          <SignInButtons callbackURL="/pieraksts" />
          <Link to="/login" className="text-sm text-muted underline hover:text-fg">
            {t("goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
