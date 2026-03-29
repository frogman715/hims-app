'use client';

import Link from "next/link";

interface ExternalComplianceManagerProps {
  compact?: boolean;
}

const shortcutCards = [
  {
    title: "KOSMA Training",
    detail:
      "Use this shortcut when office staff need to review Korean training references or open the training portal.",
    badge: "Training Reference",
    tone: "border-blue-200 bg-blue-50",
    actions: [
      { href: "/crewing/documents?type=KOSMA", label: "Open KOSMA Records", external: false },
      { href: "https://www.marinerights.or.kr/fro_end_kor/html/main/", label: "Open Training Portal", external: true },
    ],
  },
  {
    title: "Dephub Certificate Check",
    detail:
      "Use this shortcut to verify Indonesian seafarer certificates directly in the Dephub portal.",
    badge: "Certificate Portal",
    tone: "border-emerald-200 bg-emerald-50",
    actions: [
      { href: "https://pelaut.dephub.go.id/login-perusahaan", label: "Open Verification Portal", external: true },
      { href: "https://pelaut.dephub.go.id", label: "Open Public Portal", external: true },
    ],
  },
  {
    title: "Netherlands Schengen Visa",
    detail:
      "Use this shortcut to open the visa portal for joining crew that require a Netherlands Schengen visa.",
    badge: "Visa Portal",
    tone: "border-purple-200 bg-purple-50",
    actions: [
      { href: "https://consular.mfaservices.nl/", label: "Open Visa Portal", external: true },
      { href: "https://consular.mfaservices.nl", label: "Open Public Portal", external: true },
    ],
  },
];

function ShortcutAction({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
    >
      {label}
    </Link>
  );
}

export default function ExternalComplianceManager({ compact = false }: ExternalComplianceManagerProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
        This area is a shortcut panel only. It does not create or manage compliance records. Use the main MLC / IMO flow for operational compliance follow-up.
      </div>

      <div className={`grid gap-4 ${compact ? "xl:grid-cols-3" : "lg:grid-cols-3"}`}>
        {shortcutCards.map((card) => (
          <article key={card.title} className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{card.badge}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{card.title}</h3>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{card.detail}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {card.actions.map((action) => (
                <ShortcutAction
                  key={action.label}
                  href={action.href}
                  label={action.label}
                  external={action.external}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
