import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/home-sections";
import { BUSINESS } from "@/lib/catalog";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/lietosanas-noteikumi")({ component: Page });

function Page() {
  const { lang } = useLang();
  const title = lang === "ru" ? "Условия использования" : lang === "en" ? "Terms of use" : "Lietošanas noteikumi";
  return (
    <LegalLayout title={title}>
      {lang === "ru" ? (
        <>
          <p>
            Запись на сайте — это заявка на услугу ручной мойки по адресу {BUSINESS.address}. Оплата на месте. Если не
            можете приехать, позвоните заранее, чтобы освободить слот.
          </p>
          <p>Один пост: выбранное время закрепляется за одним автомобилем.</p>
        </>
      ) : lang === "en" ? (
        <>
          <p>
            A booking on this site is a request for a hand wash at {BUSINESS.address}. You pay on site. If you cannot
            come, call so we can free the slot.
          </p>
          <p>One bay: a chosen time is held for a single car.</p>
        </>
      ) : (
        <>
          <p>
            Pieraksts šajā lapā ir pieteikums roku mazgāšanai adresē {BUSINESS.address}. Apmaksa uz vietas. Ja nevarat
            ierasties, lūdzu, piezvaniet, lai atbrīvotu laiku.
          </p>
          <p>Viens posts: izvēlētais laiks tiek rezervēts vienam auto.</p>
        </>
      )}
    </LegalLayout>
  );
}
