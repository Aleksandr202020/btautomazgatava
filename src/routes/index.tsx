import { createFileRoute } from "@tanstack/react-router";
import { FaqJsonLd, HomePage, JsonLd } from "@/components/home-sections";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <JsonLd />
      <FaqJsonLd />
      <HomePage />
    </>
  );
}
