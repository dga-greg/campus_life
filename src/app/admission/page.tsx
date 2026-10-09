import { Suspense } from "react";
import Loading from "@/app/loading";
import { redirect } from "next/navigation";
import { AcceptAdmission } from "@/components/AcceptAdmission";
import { BACKGROUNDS, COURSES, formatCedis, getProgram } from "@/engine";
import { requireUserId } from "@/server/auth/session";
import { loadGame } from "@/server/game/service";

export const metadata = { title: "Admission letter" };

// The session is only known per request, so the page streams in behind a fallback.
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const game = await loadGame(await requireUserId());
  if (!game) redirect("/create");
  if (game.state.clock.phase !== "admission") redirect("/dashboard");
  const { character, wallet, academics } = game.state;
  const program = getProgram(character.programId)!;
  const fees = BACKGROUNDS.find((b) => b.id === character.backgroundId)!.firstSemesterFees;

  return (
    <main id="main" className="mx-auto w-full max-w-xl flex-1 px-5 pb-12 pt-8">
      <article className="card rise">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <div aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-night font-bold text-gold">AMU</div>
          <div>
            <p className="h-display text-lg leading-tight">Akwaaba Metropolitan University</p>
            <p className="text-sm text-ink-soft">Office of Admissions</p>
          </div>
        </div>
        <h1 className="h-display mt-5 text-2xl">Dear {character.displayName},</h1>
        <p className="mt-3">
          Akwaaba! We are pleased to offer you a place to read <strong>{program.name}</strong> in the {program.faculty}, beginning Year 1, Semester 1.
        </p>
        <h2 className="mt-5 font-bold">Your first-semester courses</h2>
        <ul className="mt-2 divide-y divide-line">
          {academics.enrollments.map((e) => (
            <li key={e.courseId} className="flex justify-between gap-3 py-2">
              <span><span className="font-semibold">{COURSES[e.courseId].code}</span> {COURSES[e.courseId].title}</span>
              <span className="shrink-0 text-ink-soft">{e.credits} cr</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-sand-deep p-4">
          <div><dt className="text-sm text-ink-soft">Hostel and registration</dt><dd className="text-lg font-bold">{formatCedis(fees)}</dd></div>
          <div><dt className="text-sm text-ink-soft">Your funds</dt><dd className="text-lg font-bold">{formatCedis(wallet)}</dd></div>
          <div className="col-span-2"><dt className="text-sm text-ink-soft">Left for the semester after fees</dt><dd className="text-lg font-bold text-forest">{formatCedis(wallet - fees)}</dd></div>
        </dl>
        <AcceptAdmission characterId={game.characterId} version={game.version} />
      </article>
    </main>
  );
}
