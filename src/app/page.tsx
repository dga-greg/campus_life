import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { APPEARANCE, type Appearance } from "@/engine";

const cast: Appearance[] = [
  { skinTone: APPEARANCE.skinTone[0], hairstyle: "braids", hairColor: APPEARANCE.hairColor[0], outfit: "kente-trim-shirt", outfitColor: APPEARANCE.outfitColor[1], accessory: "none" },
  { skinTone: APPEARANCE.skinTone[2], hairstyle: "fade", hairColor: APPEARANCE.hairColor[0], outfit: "campus-hoodie", outfitColor: APPEARANCE.outfitColor[0], accessory: "glasses" },
  { skinTone: APPEARANCE.skinTone[4], hairstyle: "headwrap", hairColor: APPEARANCE.hairColor[0], outfit: "print-dress", outfitColor: APPEARANCE.outfitColor[3], accessory: "beads" },
];

const pillars = [
  { title: "Study", body: "Five courses, real credit hours and a GPA worked out the way a registrar would." },
  { title: "Hustle", body: "A wallet counted to the pesewa. Fees are due before your first lecture." },
  { title: "Belong", body: "Roommates, clubs and elections — who you become is up to how you spend your week." },
];

export default function Landing() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-10">
      <p className="eyebrow">Campus Life Africa · Ghana edition</p>
      <h1 className="h-display mt-3 text-[2.6rem] leading-[1.05] sm:text-6xl">
        Four years.<br />Thousands of choices.<br /><span className="text-clay">One campus story.</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">
        You have an admission letter from Akwaaba Metropolitan University, a little money, and no idea how it will all turn out. Find out.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/register" className="btn-primary">Start first year</Link>
        <Link href="/login" className="btn-ghost">Continue my story</Link>
      </div>

      <div className="mt-10 flex justify-between gap-3 rounded-3xl bg-night p-5 sm:justify-around" aria-hidden="true">
        {cast.map((a, i) => <div key={i} className="rise" style={{ animationDelay: `${i * 90}ms` }}><Avatar appearance={a} size={92} /></div>)}
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {pillars.map((p) => (
          <li key={p.title} className="card">
            <h2 className="h-display text-xl">{p.title}</h2>
            <p className="mt-1.5 text-ink-soft">{p.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-ink-soft">
        Early build: character creation, admission and your student dashboard are playable today. The weekly planner and story events arrive next.
        AMU and everyone in it are fictional.
      </p>
    </main>
  );
}
