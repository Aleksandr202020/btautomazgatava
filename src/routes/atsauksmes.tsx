import { createFileRoute } from "@tanstack/react-router";
import { PageHero, ReviewsSection } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/atsauksmes")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("reviewsTitle")} lead={t("reviewsLead")} />
      <ReviewsSection />
    </>
  );
}
