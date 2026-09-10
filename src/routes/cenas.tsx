import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PricesSection } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/cenas")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("pricesTitle")} lead={t("pricesLead")} />
      <PricesSection />
    </>
  );
}
