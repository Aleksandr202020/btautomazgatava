import {
  Armchair,
  CircleDot,
  CloudRain,
  Disc,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXTRAS, type ExtraId } from "@/lib/catalog";
import { useLang } from "@/lib/lang";
import { cn, formatEuro } from "@/lib/utils";

const EXTRA_ICONS: Record<ExtraId, JSX.Element> = {
  fragrance: <Sparkles className="size-6" />,
  tyres: <CircleDot className="size-6" />,
  leather: <Armchair className="size-6" />,
  antirain: <CloudRain className="size-6" />,
  discs: <Disc className="size-6" />,
  engine: <Wrench className="size-6" />,
};

type Props = {
  extras: ExtraId[];
  onChange: (extras: ExtraId[]) => void;
  onSkip: () => void;
  onNext: () => void;
  skipLabel: string;
  nextLabel: string;
  title: string;
};

export function ExtrasStep({ extras, onChange, onSkip, onNext, skipLabel, nextLabel, title }: Props) {
  const { lang } = useLang();

  return (
    <div>
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">
        {lang === "ru"
          ? "Выберите дополнительные услуги. Можно пропустить."
          : lang === "en"
            ? "Choose optional extras. You can skip this step."
            : "Izvēlieties papildu pakalpojumus. Varat izlaist."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EXTRAS.map((e) => {
          const on = extras.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                const next: ExtraId[] = on
                  ? extras.filter((id) => id !== e.id)
                  : [...extras, e.id];
                onChange(next);
              }}
              className={cn(
                "group relative flex flex-col rounded-2xl border bg-elevated p-5 text-left transition-all",
                on
                  ? "border-accent ring-2 ring-accent/30 shadow-sm"
                  : "border-border hover:border-fg/40 hover:shadow-sm",
              )}
            >
              <div
                className={cn(
                  "mb-4 flex size-12 items-center justify-center rounded-xl",
                  on ? "bg-accent/15 text-accent" : "bg-muted/30 text-muted",
                )}
              >
                {EXTRA_ICONS[e.id]}
              </div>

              <h3 className="font-medium leading-snug">{e.label[lang]}</h3>

              <div className="mt-3 flex items-end justify-between">
                <span className="text-xl font-semibold tabular-nums text-accent">
                  +{formatEuro(e.price, lang)}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    on ? "text-accent" : "text-muted",
                  )}
                >
                  {on
                    ? lang === "ru"
                      ? "Выбрано"
                      : lang === "en"
                        ? "Selected"
                        : "Izvēlēts"
                    : "＋"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" onClick={onSkip}>
          {skipLabel}
        </Button>
        <Button size="lg" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
