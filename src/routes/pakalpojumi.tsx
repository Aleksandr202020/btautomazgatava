import { createFileRoute } from "@tanstack/react-router";
import { PageHero, ServicesSection } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/pakalpojumi")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("servicesTitle")} lead={t("servicesLead")} />
      <ServicesSection />
    </>
  );
}
