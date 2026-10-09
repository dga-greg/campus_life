import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Log in" };

export default function Page() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center p-5 pt-10">
      <p className="eyebrow">Akwaaba Metropolitan University</p>
      <h1 className="h-display mb-6 mt-2 text-3xl">Welcome back</h1>
      <SignIn />
    </main>
  );
}
