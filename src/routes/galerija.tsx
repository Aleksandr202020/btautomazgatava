import { createFileRoute } from "@tanstack/react-router";
import { GallerySection, PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/galerija")({ component: Page });

function Page() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("galleryTitle")} lead={t("galleryLead")} />
      <GallerySection />
    </>
  );
}
