import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/home-sections";
import { BUSINESS } from "@/lib/catalog";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/privatuma-politika")({ component: Page });

function Page() {
  const { lang } = useLang();
  const title = lang === "ru" ? "Политика конфиденциальности" : lang === "en" ? "Privacy policy" : "Privātuma politika";
  return (
    <LegalLayout title={title}>
      {lang === "ru" ? (
        <>
          <p>
            Контролёр данных: {BUSINESS.name}, {BUSINESS.address}. Контакт: {BUSINESS.email}, {BUSINESS.phoneDisplay}.
          </p>
          <p>
            Мы обрабатываем имя и телефон (по желанию — email и комментарий) только для записи на мойку, связи с вами и
            учёта визита. Правовая основа — договор на услугу и наш законный интерес вести журнал записей.
          </p>
          <p>
            Данные хранятся, пока запись актуальна, и затем разумно для бухгалтерии / претензий. Мы не продаём данные и
            не передаём их третьим лицам, кроме хостинга, необходимого для работы сайта.
          </p>
          <p>
            Вы можете запросить доступ, исправление или удаление: напишите на {BUSINESS.email} или позвоните. Жалоба:
            Datu valsts inspekcija (Латвия).
          </p>
        </>
      ) : lang === "en" ? (
        <>
          <p>
            Data controller: {BUSINESS.name}, {BUSINESS.address}. Contact: {BUSINESS.email}, {BUSINESS.phoneDisplay}.
          </p>
          <p>
            We process your name and phone (and optionally email and a comment) only to book a wash, contact you and keep
            a visit log. The legal basis is the service contract and our legitimate interest in running the diary.
          </p>
          <p>
            Data is kept while the booking is active and then for a reasonable accounting / claims period. We do not sell
            data. Hosting providers needed to run the site may process it on our instructions.
          </p>
          <p>
            You may request access, correction or deletion via {BUSINESS.email} or by phone. You may complain to the
            Latvian Data State Inspectorate (DVI).
          </p>
        </>
      ) : (
        <>
          <p>
            Datu pārzinis: {BUSINESS.name}, {BUSINESS.address}. Kontakti: {BUSINESS.email}, {BUSINESS.phoneDisplay}.
          </p>
          <p>
            Mēs apstrādājam vārdu un tālruni (pēc izvēles e-pastu un komentāru) tikai pierakstam uz mazgāšanu, saziņai un
            vizītes uzskaitei. Tiesiskais pamats — pakalpojuma līgums un leģitīmās intereses vest pierakstu žurnālu.
          </p>
          <p>
            Dati tiek glabāti, kamēr pieraksts ir aktuāls, un pēc tam saprātīgu grāmatvedības / pretenziju periodu. Datus
            nepārdodam. Hostinga sniedzējs var tos apstrādāt pēc mūsu norādījuma, lai lapa darbotos.
          </p>
          <p>
            Jūs varat pieprasīt piekļuvi, labojumu vai dzēšanu: {BUSINESS.email} vai tālrunis. Sūdzība: Datu valsts
            inspekcija.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
