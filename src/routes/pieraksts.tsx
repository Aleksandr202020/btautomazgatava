import { createFileRoute } from "@tanstack/react-router";
import { BookingWizard } from "@/components/booking-wizard";
import { PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/pieraksts")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("bookCta")} lead={t("stepAccountLead")} />
      <div className="mx-auto max-w-lg border-x border-line">
        <BookingWizard embedded />
      </div>
    </>
  );
}
