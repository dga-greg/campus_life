import { redirect } from "next/navigation";
import { CharacterCreator } from "@/components/CharacterCreator";
import { requireUserId } from "@/server/auth/session";
import { loadGame } from "@/server/game/service";

export const metadata = { title: "Create your student" };

export default async function Page() {
  const userId = await requireUserId();
  if (await loadGame(userId)) redirect("/dashboard");
  return <CharacterCreator />;
}
