import { createFileRoute } from "@tanstack/react-router";
import { FaqJsonLd, FaqSection, PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/buj")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <FaqJsonLd />
      <PageHero title={t("faqTitle")} />
      <FaqSection />
    </>
  );
}
