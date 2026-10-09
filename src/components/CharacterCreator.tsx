"use client";

import { useState, useTransition } from "react";
import { createCharacterAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import {
  AMBITIONS, APPEARANCE, BACKGROUNDS, BASE_STATS, HOMETOWNS, MAX_TRAITS, PROGRAMS, STAT_LABELS, TRAITS,
  characterInputSchema, formatCedis, type CharacterInput, type StatKey,
} from "@/engine";

const STEPS = ["Look", "Identity", "Programme", "Background"] as const;
const pretty = (id: string) => id.replace(/-/g, " ").replace(/^\w/, (m) => m.toUpperCase());

function Choice({ checked, onChange, name, type = "radio", children, className = "" }: {
  checked: boolean; onChange: () => void; name: string; type?: "radio" | "checkbox"; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={`flex min-h-12 cursor-pointer items-center rounded-2xl border-2 px-4 py-2.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-night ${checked ? "border-forest bg-forest/10" : "border-line bg-white"} ${className}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

function Swatches({ legend, name, values, value, onPick }: { legend: string; name: string; values: readonly string[]; value: string; onPick: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2.5">
        {values.map((v, i) => (
          <label key={v} className={`size-11 cursor-pointer rounded-full border-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-night ${value === v ? "border-forest" : "border-white"}`} style={{ background: v }}>
            <input type="radio" name={name} checked={value === v} onChange={() => onPick(v)} className="sr-only" aria-label={`${legend} ${i + 1}`} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Options({ legend, name, values, value, onPick }: { legend: string; name: string; values: readonly string[]; value: string; onPick: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => <Choice key={v} name={name} checked={value === v} onChange={() => onPick(v)}>{pretty(v)}</Choice>)}
      </div>
    </fieldset>
  );
}

export function CharacterCreator() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [c, setC] = useState<CharacterInput>({
    displayName: "",
    hometown: "Accra",
    programId: "",
    backgroundId: "",
    ambitionId: AMBITIONS[0].id,
    traits: [],
    appearance: { skinTone: APPEARANCE.skinTone[1], hairstyle: "afro", hairColor: APPEARANCE.hairColor[0], outfit: "kente-trim-shirt", outfitColor: APPEARANCE.outfitColor[1], accessory: "none" },
  });
  const set = (patch: Partial<CharacterInput>) => { setC((p) => ({ ...p, ...patch })); setError(undefined); };
  const look = (patch: Partial<CharacterInput["appearance"]>) => set({ appearance: { ...c.appearance, ...patch } });

  function validateStep(): string | undefined {
    const fields: (keyof CharacterInput)[][] = [["appearance"], ["displayName", "hometown", "ambitionId", "traits"], ["programId"], ["backgroundId"]];
    const result = characterInputSchema.safeParse(c);
    if (result.success) return undefined;
    return result.error.issues.find((i) => fields[step].includes(i.path[0] as keyof CharacterInput))?.message;
  }

  function next() {
    const problem = validateStep();
    if (problem) return setError(problem);
    if (step < STEPS.length - 1) return setStep(step + 1);
    startTransition(async () => {
      const res = await createCharacterAction(c);
      if (res?.error) setError(res.error);
    });
  }

  const toggleTrait = (t: string) =>
    set({ traits: c.traits.includes(t) ? c.traits.filter((x) => x !== t) : c.traits.length < MAX_TRAITS ? [...c.traits, t] : c.traits });

  return (
    <main id="main" className="mx-auto w-full max-w-xl flex-1 px-5 pb-32 pt-6">
      <p className="eyebrow">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-clay" : "bg-line"}`} />)}
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Avatar appearance={c.appearance} size={96} />
        <div>
          <h1 className="h-display text-2xl">{c.displayName.trim() || "New student"}</h1>
          <p className="text-ink-soft">{PROGRAMS.find((p) => p.id === c.programId)?.name ?? "Programme not chosen yet"}</p>
        </div>
      </div>

      <div className="rise mt-6 flex flex-col gap-6" key={step}>
        {step === 0 && (<>
          <Swatches legend="Skin tone" name="skin" values={APPEARANCE.skinTone} value={c.appearance.skinTone} onPick={(v) => look({ skinTone: v })} />
          <Options legend="Hairstyle" name="hair" values={APPEARANCE.hairstyle} value={c.appearance.hairstyle} onPick={(v) => look({ hairstyle: v })} />
          <Swatches legend="Hair colour" name="haircolor" values={APPEARANCE.hairColor} value={c.appearance.hairColor} onPick={(v) => look({ hairColor: v })} />
          <Options legend="Outfit" name="outfit" values={APPEARANCE.outfit} value={c.appearance.outfit} onPick={(v) => look({ outfit: v })} />
          <Swatches legend="Outfit colour" name="outfitcolor" values={APPEARANCE.outfitColor} value={c.appearance.outfitColor} onPick={(v) => look({ outfitColor: v })} />
          <Options legend="Accessory" name="accessory" values={APPEARANCE.accessory} value={c.appearance.accessory} onPick={(v) => look({ accessory: v })} />
        </>)}

        {step === 1 && (<>
          <label className="flex flex-col gap-1.5 font-bold">
            Display name
            <input className="field font-normal" value={c.displayName} maxLength={24} autoComplete="off" onChange={(e) => set({ displayName: e.target.value })} aria-describedby="name-hint" />
            <span id="name-hint" className="text-sm font-normal text-ink-soft">Shown on your results cards. It does not need to be your real name.</span>
          </label>
          <label className="flex flex-col gap-1.5 font-bold">
            Hometown
            <select className="field font-normal" value={c.hometown} onChange={(e) => set({ hometown: e.target.value })}>
              {HOMETOWNS.map((h) => <option key={h}>{h}</option>)}
            </select>
            <span className="text-sm font-normal text-ink-soft">Shapes your story, never your abilities.</span>
          </label>
          <fieldset>
            <legend className="mb-2 font-bold">What do you want from these four years?</legend>
            <div className="flex flex-col gap-2">
              {AMBITIONS.map((a) => <Choice key={a.id} name="ambition" checked={c.ambitionId === a.id} onChange={() => set({ ambitionId: a.id })}>{a.label}</Choice>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-bold">Personality <span className="font-normal text-ink-soft">(pick up to {MAX_TRAITS})</span></legend>
            <div className="flex flex-wrap gap-2">
              {TRAITS.map((t) => <Choice key={t} type="checkbox" name="traits" checked={c.traits.includes(t)} onChange={() => toggleTrait(t)}>{t}</Choice>)}
            </div>
          </fieldset>
        </>)}

        {step === 2 && (
          <fieldset>
            <legend className="mb-2 font-bold">Choose your programme</legend>
            <div className="flex flex-col gap-2.5">
              {PROGRAMS.map((p) => (
                <Choice key={p.id} name="program" checked={c.programId === p.id} onChange={() => set({ programId: p.id })}>
                  <span><span className="block font-bold">{p.name}</span><span className="block text-sm text-ink-soft">{p.faculty} · {p.blurb}</span></span>
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="mb-2 font-bold">Where are you starting from?</legend>
            <div className="flex flex-col gap-3">
              {BACKGROUNDS.map((b) => (
                <Choice key={b.id} name="background" checked={c.backgroundId === b.id} onChange={() => set({ backgroundId: b.id })} className="!items-start">
                  <span className="flex flex-col gap-1 py-1">
                    <span className="font-bold">{b.name}</span>
                    <span className="text-sm text-ink-soft">{b.summary}</span>
                    <span className="text-sm"><strong className="text-forest">Upside:</strong> {b.upside}</span>
                    <span className="text-sm"><strong className="text-clay-deep">Trade-off:</strong> {b.tradeoff}</span>
                    <span className="text-sm text-ink-soft">
                      Starts with {formatCedis(b.startingWallet)} · first-semester fees {formatCedis(b.firstSemesterFees)}
                      {" · "}{Object.entries(b.statMods).map(([k, v]) => `${STAT_LABELS[k as StatKey]} ${BASE_STATS[k as StatKey] + v!}`).join(", ")}
                    </span>
                  </span>
                </Choice>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-sand/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          <p role="alert" className="min-h-5 text-sm font-semibold text-clay-deep">{error}</p>
          <div className="flex gap-3">
            {step > 0 && <button type="button" className="btn-ghost" onClick={() => { setStep(step - 1); setError(undefined); }} disabled={pending}>Back</button>}
            <button type="button" className="btn-primary flex-1" onClick={next} disabled={pending}>
              {pending ? "Enrolling…" : step === STEPS.length - 1 ? "Apply to AMU" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
