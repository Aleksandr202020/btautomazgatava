import { createFileRoute } from "@tanstack/react-router";
import { ContactSection, PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/kontakti")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("contactTitle")} lead={t("contactLead")} />
      <ContactSection />
    </>
  );
}
