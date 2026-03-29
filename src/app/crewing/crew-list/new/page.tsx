import Link from "next/link";
import { redirect } from "next/navigation";

export default function CrewListNewRedirectPage() {
  redirect("/crewing/assignments/new");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Crew List</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Use Assignment Creation Instead</h1>
        <p className="mt-3 text-sm text-slate-600">
          Crew list records are generated from live assignment data. Create a new movement record from the assignment desk.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/crewing/assignments/new"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open Assignment Creation
          </Link>
          <Link
            href="/crewing/crew-list"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back to Crew List
          </Link>
        </div>
      </div>
    </div>
  );
}
