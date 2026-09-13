import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignInButtons } from "@/lib/auth/gates";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 h-12 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none transition focus:border-fg";

type LoginProps = {
  callbackURL?: string;
  embedded?: boolean;
  onSuccess?: () => void;
};

export function LoginForm({ callbackURL = "/kabinets", embedded, onSuccess }: LoginProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!authEnabled) {
      setError(t("authDisabledHint"));
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: remember,
        callbackURL,
      });
      if (err) {
        setError(err.message || t("loginFailed"));
        return;
      }
      if (onSuccess) onSuccess();
      else void navigate({ to: callbackURL });
    } catch {
      setError(t("loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-md", !embedded && "px-4")}>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="sr-only">{t("email")}</span>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="sr-only">{t("password")}</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            minLength={8}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-border"
          />
          {t("rememberMe")}
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" variant="accent" disabled={busy}>
          {busy ? "…" : t("loginSubmit")}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/kontakti" className="text-muted hover:text-fg">
          {t("forgotPassword")}
        </Link>
        <Link to="/register" className="font-medium text-accent hover:underline">
          {t("registerLink")}
        </Link>
      </div>

      {authEnabled ? (
        <div className="mt-8 space-y-3">
          <p className="text-center text-xs uppercase tracking-[0.14em] text-muted">{t("orContinueWith")}</p>
          <SignInButtons callbackURL={callbackURL} />
        </div>
      ) : null}
    </div>
  );
}

type RegisterProps = {
  callbackURL?: string;
};

export function RegisterForm({ callbackURL = "/kabinets" }: RegisterProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [email2, setEmail2] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!authEnabled) {
      setError(t("authDisabledHint"));
      return;
    }
    if (email.trim() !== email2.trim()) {
      setError(t("emailMismatch"));
      return;
    }
    if (password !== password2) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!privacy) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    try {
      const displayName = name.trim() || email.trim();
      const { error: err } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: displayName,
        callbackURL,
      });
      if (err) {
        setError(err.message || t("registerFailed"));
        return;
      }
      // Optional: store phone in comment path later; phone is collected for UX parity with ENRI.
      void phone;
      void navigate({ to: callbackURL });
    } catch {
      setError(t("registerFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          placeholder={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoComplete="name"
        />
        <input
          type="email"
          required
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoComplete="email"
        />
        <input
          type="email"
          required
          placeholder={t("emailConfirm")}
          value={email2}
          onChange={(e) => setEmail2(e.target.value)}
          className={inputClass}
          autoComplete="email"
        />
        <input
          type="tel"
          placeholder={t("phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          autoComplete="tel"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("passwordConfirm")}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
        />
        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            className="mt-1 size-4"
            required
          />
          <span>
            {t("privacyAgree")}{" "}
            <Link to="/privatuma-politika" className="text-accent underline">
              {t("privacy")}
            </Link>
          </span>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" variant="accent" disabled={busy}>
          {busy ? "…" : t("registerSubmit")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t("alreadyHaveAccount")}{" "}
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t("loginSubmit")}
        </Link>
      </p>
    </div>
  );
}

/** Keep type-checker happy when OAuth helper is tree-shaken in pure email mode. */
void signIn;
