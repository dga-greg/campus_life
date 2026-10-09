import { Suspense } from "react";
import Loading from "@/app/loading";
import { redirect } from "next/navigation";
import { CharacterCreator } from "@/components/CharacterCreator";
import { requireUserId } from "@/server/auth/session";
import { loadGame } from "@/server/game/service";

export const metadata = { title: "Create your student" };

// The session is only known per request, so the page streams in behind a fallback.
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const userId = await requireUserId();
  if (await loadGame(userId)) redirect("/dashboard");
  return <CharacterCreator />;
}
