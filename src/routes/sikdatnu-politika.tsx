import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/sikdatnu-politika")({ component: Page });

function Page() {
  const { lang } = useLang();
  const title = lang === "ru" ? "Политика cookies" : lang === "en" ? "Cookie policy" : "Sīkdatņu politika";
  return (
    <LegalLayout title={title}>
      {lang === "ru" ? (
        <>
          <p>Необходимые cookies запоминают язык и согласие. Без них сайт не запомнит ваш выбор.</p>
          <p>Аналитические cookies не ставятся, пока вы не согласитесь в баннере.</p>
        </>
      ) : lang === "en" ? (
        <>
          <p>Essential cookies remember language and consent. Without them the site cannot store your choice.</p>
          <p>Analytics cookies are not set until you agree in the banner.</p>
        </>
      ) : (
        <>
          <p>Nepieciešamās sīkdatnes atceras valodu un piekrišanu. Bez tām lapa nevar saglabāt Jūsu izvēli.</p>
          <p>Analītikas sīkdatnes netiek iestatītas, kamēr Jūs nepiekrītat bannerī.</p>
        </>
      )}
    </LegalLayout>
  );
}
