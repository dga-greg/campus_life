import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Avatar } from "@/components/Avatar";
import { AMBITIONS, BACKGROUNDS, COURSES, STAT_KEYS, STAT_LABELS, formatCedis, formatGpa, getProgram } from "@/engine";
import { requireUserId } from "@/server/auth/session";
import { loadGame, recentTransactions } from "@/server/game/service";

export const metadata = { title: "Dashboard" };

export default async function Page() {
  const userId = await requireUserId();
  const game = await loadGame(userId);
  if (!game) redirect("/create");
  if (game.state.clock.phase === "admission") redirect("/admission");
  const { character, stats, wallet, clock, academics } = game.state;
  const program = getProgram(character.programId)!;
  const ledger = await recentTransactions(userId, 5);
  const credits = academics.enrollments.reduce((n, e) => n + e.credits, 0);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-12 pt-6">
      <header className="flex items-center gap-4">
        <Avatar appearance={character.appearance} size={84} label={`${character.displayName}'s avatar`} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Year {clock.year} · Semester {clock.semester} · Week {clock.week}</p>
          <h1 className="h-display truncate text-2xl">{character.displayName}</h1>
          <p className="text-ink-soft">{program.name} · from {character.hometown}</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-[3fr_2fr] gap-3">
        <section className="card" aria-labelledby="w"><h2 id="w" className="text-sm text-ink-soft">Wallet</h2><p className="text-xl font-bold tabular-nums sm:text-2xl">{formatCedis(wallet)}</p></section>
        <section className="card" aria-labelledby="g"><h2 id="g" className="text-sm text-ink-soft">CGPA</h2><p className="text-xl font-bold tabular-nums sm:text-2xl">{formatGpa(academics.cgpaX100)}</p><p className="text-sm text-ink-soft">{academics.cgpaX100 === null ? "No results yet" : ""}</p></section>
      </div>

      <section className="card mt-4 border-dashed bg-sand-deep" aria-labelledby="next">
        <h2 id="next" className="h-display text-xl">Week {clock.week} is waiting</h2>
        <p className="mt-1 text-ink-soft">The weekly planner — where you spend your action slots on lectures, study, work and friends — is the next milestone and is not built yet. Your student, wallet and courses are saved and will carry over.</p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="card" aria-labelledby="s">
          <h2 id="s" className="h-display text-xl">How you are doing</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {STAT_KEYS.map((k) => (
              <li key={k}>
                <div className="flex justify-between text-sm"><span id={`stat-${k}`}>{STAT_LABELS[k]}</span><span className="font-bold">{stats[k]}</span></div>
                <div role="progressbar" aria-labelledby={`stat-${k}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats[k]} className="mt-1 h-2.5 overflow-hidden rounded-full bg-sand-deep">
                  <div className="h-full rounded-full bg-forest" style={{ width: `${stats[k]}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4">
          <section className="card" aria-labelledby="c">
            <h2 id="c" className="h-display text-xl">This semester</h2>
            <ul className="mt-2 divide-y divide-line">
              {academics.enrollments.map((e) => (
                <li key={e.courseId} className="flex justify-between gap-3 py-2 text-sm">
                  <span><span className="font-bold">{COURSES[e.courseId].code}</span> {COURSES[e.courseId].title}</span>
                  <span className="shrink-0 text-ink-soft">{e.credits} cr</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink-soft">{credits} credit hours registered</p>
          </section>

          <section className="card" aria-labelledby="l">
            <h2 id="l" className="h-display text-xl">Recent money</h2>
            <ul className="mt-2 divide-y divide-line">
              {ledger.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span>{t.reason}</span>
                  <span className={`shrink-0 font-bold ${t.amountPesewas < 0 ? "text-clay-deep" : "text-forest"}`}>{t.amountPesewas > 0 ? "+" : ""}{formatCedis(t.amountPesewas)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="a">
            <h2 id="a" className="h-display text-xl">About you</h2>
            <p className="mt-2 text-sm"><strong>{BACKGROUNDS.find((b) => b.id === character.backgroundId)!.name}</strong> · {character.traits.join(", ")}</p>
            <p className="mt-1 text-sm text-ink-soft">Ambition: {AMBITIONS.find((a) => a.id === character.ambitionId)!.label}</p>
          </section>
        </div>
      </div>

      <div className="mt-8"><SignOutButton redirectUrl="/"><button className="btn-ghost w-full sm:w-auto">Log out</button></SignOutButton></div>
    </main>
  );
}
