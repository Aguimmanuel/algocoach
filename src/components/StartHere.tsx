import { useState } from "react";
import { useReveal, useRevealStagger } from "../hooks/useReveal";
import { BookOpen, ChevronDown, GraduationCap, KeyRound, Timer } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { CONSTRAINT_STEPS, SPEED_TABLE, VERDICT_STYLE } from "../data/basics";
import { GLOSSARY } from "../data/glossary";
import { cn } from "@/lib/utils";

export default function StartHere() {
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Each big section fades up as it enters the viewport. A page this long reads
  // as endless otherwise; motion gives it a sense of arriving somewhere.
  const heroRef = useReveal<HTMLElement>();
  const speedRef = useReveal<HTMLElement>({ delay: 60 });
  const trickRef = useReveal<HTMLElement>({ delay: 60 });
  const glossaryRef = useReveal<HTMLElement>({ delay: 60 });
  const speedRows = useRevealStagger<HTMLDivElement>(50);
  const termGrid = useRevealStagger<HTMLDivElement>(35);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="surface rounded-xl"
    >
      <CollapsibleTrigger asChild>
        <button className="press flex w-full items-center gap-4 p-5 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-foreground">New to algorithms?</span>
            <span className="block text-sm text-muted-foreground">
              Four short reads — what an algorithm is, what O(n) means, and every word in plain English.
            </span>
          </span>
          <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-6 border-t border-border p-5">
      {/* ------------------------------------------------ what is an algorithm */}
      <section ref={heroRef} className="reveal slab rounded-xl p-6 text-strong-foreground sm:p-9">
        <p className="text-sm font-semibold tracking-widest text-strong-foreground/85 uppercase">The basics</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          What an algorithm actually is
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-strong-foreground/85">
          An algorithm is a recipe — a set of steps that turns an input into an output. Finding the largest number in
          a list is an algorithm. So is looking up someone's phone number. You do both without thinking.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-strong-foreground/85">
          What makes a <em>problem</em> hard is not writing steps that work. It's that some recipes are a million
          times faster than others, and picking the right one is the skill nobody teaches directly.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Same job, two recipes", "Checking every name in a phone book takes 500 steps. Halving takes 9. Same answer."],
            ["2", "The size decides", "Read how big the input can get. That single number rules recipes in or out."],
            ["3", "Every problem is a pattern", "A few hundred interview problems are really about 16 ideas, wearing disguises."],
          ].map(([n, title, detail]) => (
            <div key={n} className="rounded-lg bg-strong-foreground/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-strong-foreground text-xs font-bold text-strong">
                  {n}
                </span>
                {title}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ big-o */}
      <section ref={speedRef} className="reveal surface rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Timer className="size-5 text-muted-foreground" />
          What "O(n)" actually means
        </h2>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Big-O is not a score or a grade. It answers one question:{" "}
          <strong className="text-foreground">if I double the amount of data, how much more work do I do?</strong>{" "}
          Read <strong>n</strong> as "the number of things I have". So O(n) means "work grows in step with the data".
        </p>

        <div ref={speedRows} className="mt-6 space-y-2.5">
          {SPEED_TABLE.map((row) => {
            const v = VERDICT_STYLE[row.verdict];
            return (
              <div key={row.bigO} className="reveal lift rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary px-2.5 py-1 font-mono text-sm font-bold text-primary-foreground">
                    {row.bigO}
                  </span>
                  <span className="font-semibold text-foreground">{row.plainName}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", v.className)}>{v.label}</span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Means</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{row.meaning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Picture it as</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{row.analogy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Looks like</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{row.shape}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ the constraint trick */}
      <section ref={trickRef} className="reveal surface rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <KeyRound className="size-5 text-muted-foreground" />
          The trick that makes this click
        </h2>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          You don't have to guess which algorithm to use. The problem statement tells you, if you read the size limit.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CONSTRAINT_STEPS.map((s, i) => (
            <div key={s.step} className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="font-semibold text-foreground">{s.step}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
              <p className="mt-2 rounded-xl bg-card p-2.5 font-mono text-xs text-muted-foreground ring-1 ring-border">
                {s.example}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-strong-foreground/10 p-4 text-strong-foreground">
          <p className="text-sm font-semibold">Worked example</p>
          <p className="mt-1.5 text-sm leading-relaxed text-strong-foreground/85">
            A problem says <span className="font-mono text-strong-foreground">1 ≤ n ≤ 10⁵</span>. Two nested loops would be
            10⁵ × 10⁵ = 10¹⁰ steps. At 10⁸ steps per second that's about{" "}
            <strong className="text-strong-foreground">100 seconds</strong> — far too slow. So the answer cannot use nested loops;
            it needs O(n) or O(n log n). That rules out most patterns instantly and leaves you a shortlist. That's the
            whole game.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ glossary */}
      <section ref={glossaryRef} className="reveal surface rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <BookOpen className="size-5 text-muted-foreground" />
          Every word, in plain English
        </h2>
        <p className="mt-1 text-muted-foreground">
          Tap any word. Nothing here uses a term that isn't also explained here.
        </p>

        <div ref={termGrid} className="mt-5 space-y-6">
          {GLOSSARY.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-bold text-foreground">
                <span aria-hidden>{group.emoji}</span> {group.title}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{group.blurb}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.terms.map((t) => {
                  const open = openTerm === t.term;
                  return (
                    <button
                      key={t.term}
                      onClick={() => setOpenTerm(open ? null : t.term)}
                      className={cn(
                        "reveal lift rounded-lg border p-3 text-left transition",
                        open ? "border-primary bg-muted" : "border-border hover:border-ring",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">{t.term}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{open ? "−" : "+"}</span>
                      </div>
                      {open && (
                        <div className="mt-2 space-y-1.5">
                          <p className="text-sm text-muted-foreground">{t.meaning}</p>
                          {t.why && (
                            <p className="rounded-xl bg-card p-2 text-xs text-muted-foreground ring-1 ring-border">
                              {t.why}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

          <p className="text-center text-sm text-muted-foreground">
            Ready to try a real problem? Head to the <strong className="text-foreground">Coach</strong> tab and paste one in.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
