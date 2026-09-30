import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-white">( ˶°ㅁ°) !!</div>
    </div>
  );
}
