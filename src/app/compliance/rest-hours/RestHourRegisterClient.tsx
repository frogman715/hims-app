"use client";

import { useState, useTransition } from "react";
import type { RestHourRegisterData } from "@/lib/compliance-rest-hours";

type Props = {
  initialData: RestHourRegisterData;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RestHourRegisterClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    vesselCrewKey: initialData.options[0] ? `${initialData.options[0].vesselId}:${initialData.options[0].crewId}` : "",
    logDate: new Date().toISOString().slice(0, 10),
    workHours: "14",
    restHours: "10",
    minimumRestHours: "10",
    remarks: "",
  });

  async function refreshData() {
    const response = await fetch("/api/compliance/rest-hours", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh rest-hour register");
    }

    const payload = (await response.json()) as RestHourRegisterData;
    setData(payload);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const [vesselId, crewId] = form.vesselCrewKey.split(":");
    if (!vesselId || !crewId) {
      setError("Select vessel and crew first.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/compliance/rest-hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vesselId,
            crewId,
            logDate: form.logDate,
            workHours: Number(form.workHours),
            restHours: Number(form.restHours),
            minimumRestHours: Number(form.minimumRestHours),
            remarks: form.remarks.trim() || null,
          }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Failed to save rest-hour entry");
        }

        await refreshData();
        setSuccess("Rest-hour register saved.");
        setForm((current) => ({ ...current, remarks: "" }));
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to save rest-hour entry");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Entries last 7 days</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.entriesLast7Days}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">Non-compliant entries</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">{data.summary.nonCompliantEntries}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active vessels tracked</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.activeVesselsTracked}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Coverage gaps</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{data.summary.coverageGapCrews}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent digital register</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Crew</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Vessel</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Work</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Rest</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 text-slate-700">{formatDate(entry.logDate)}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-semibold text-slate-900">{entry.crewName}</div>
                      <div className="text-slate-500">{entry.rank}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{entry.vesselName}</td>
                    <td className="px-6 py-4 text-slate-700">{entry.workHours} h</td>
                    <td className="px-6 py-4 text-slate-700">{entry.restHours} h</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.isCompliant ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {entry.isCompliant ? "COMPLIANT" : "ACTION REQUIRED"}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No rest-hour records yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Coverage gaps</h2>
          <div className="mt-4 space-y-3">
            {data.coverageGaps.slice(0, 12).map((gap) => (
              <div key={`${gap.vesselId}-${gap.crewId}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">{gap.crewName} • {gap.rank}</p>
                <p className="text-sm text-amber-800">{gap.vesselName}</p>
                <p className="mt-1 text-sm text-amber-700">{gap.reason}</p>
              </div>
            ))}
            {data.coverageGaps.length === 0 ? <p className="text-sm text-slate-500">No active coverage gap detected.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add or update daily record</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Record one entry per crew per vessel per day. System will update the same date if already logged.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Vessel / Crew
            <select
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600"
              value={form.vesselCrewKey}
              onChange={(event) => setForm((current) => ({ ...current, vesselCrewKey: event.target.value }))}
            >
              {data.options.map((option) => (
                <option key={`${option.vesselId}:${option.crewId}`} value={`${option.vesselId}:${option.crewId}`}>
                  {option.vesselName} • {option.crewName} ({option.rank})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Log date
            <input
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600"
              value={form.logDate}
              onChange={(event) => setForm((current) => ({ ...current, logDate: event.target.value }))}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              Work hours
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600"
                value={form.workHours}
                onChange={(event) => setForm((current) => ({ ...current, workHours: event.target.value }))}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Rest hours
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600"
                value={form.restHours}
                onChange={(event) => setForm((current) => ({ ...current, restHours: event.target.value }))}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Minimum rest
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600"
                value={form.minimumRestHours}
                onChange={(event) => setForm((current) => ({ ...current, minimumRestHours: event.target.value }))}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Remarks
            <textarea
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600"
              value={form.remarks}
              onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
            />
          </label>

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

          <button
            type="submit"
            disabled={isPending || data.options.length === 0}
            className="w-full rounded-full bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? "Saving..." : "Save rest-hour record"}
          </button>
        </form>
      </section>
    </div>
  );
}
