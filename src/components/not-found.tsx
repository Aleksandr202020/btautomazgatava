import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBookingUi } from "@/lib/booking-ui";

export function NotFoundPage({ title, home, book }: { title: string; home: string; book: string }) {
  const openWizard = useBookingUi((s) => s.openWizard);
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center px-4 py-24">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">404</p>
      <h1 className="mt-4 font-display text-5xl">{title}</h1>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-md bg-fg px-6 text-sm uppercase tracking-[0.12em] text-bg"
        >
          {home}
        </Link>
        <Button variant="secondary" size="lg" onClick={openWizard}>
          {book}
        </Button>
      </div>
    </main>
  );
}
