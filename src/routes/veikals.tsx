import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/veikals")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title="Shop" lead={t("shopSoon")} />
      <div className="mx-auto max-w-6xl px-4 py-16 text-muted">{t("shopSoon")}</div>
    </>
  );
}
