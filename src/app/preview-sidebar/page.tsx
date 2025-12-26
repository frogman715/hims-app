"use client";

import Sidebar from "@/components/sidebar/Sidebar";

const navigationItems = [
  { href: "/crewing", label: "Crewing Department", icon: "⚓" },
  { href: "/contracts", label: "Contracts", icon: "📋" },
  { href: "/crewing/documents", label: "Documents", icon: "📁" },
  { href: "/insurance", label: "Insurance", icon: "⚡" },
  { href: "/crewing/principals", label: "Fleet Management", icon: "🚢" },
  { href: "/accounting", label: "Accounting", icon: "💵" },
];

export default function PreviewSidebar() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar navigationItems={navigationItems} />
      <main className="flex-1 p-10">
        <section className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-4xl font-semibold text-slate-900">Navigation Preview</h1>
            <p className="text-base text-slate-600">
              This summary displays the final sidebar view after design customization
              terkini diterapkan.
            </p>
          </header>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-slate-900">Perbaikan Utama</h2>
            <dl className="mt-6 space-y-5">
              <div className="flex items-start gap-4">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  1
                </span>
                <div className="space-y-1">
                  <dt className="text-lg font-medium text-slate-800">Area branding diperbesar</dt>
                  <dd className="text-sm text-slate-600">
                    Logo diperbesar menjadi 128px dan disejajarkan ulang untuk memberi kesan profesional tanpa teks tambahan.
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  2
                </span>
                <div className="space-y-1">
                  <dt className="text-lg font-medium text-slate-800">Tipografi menu disempurnakan</dt>
                  <dd className="text-sm text-slate-600">
                    Ukuran ikon ditingkatkan dan label menu dibuat lebih tebal agar navigasi mudah dipindai oleh pengguna.
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  3
                </span>
                <div className="space-y-1">
                  <dt className="text-lg font-medium text-slate-800">Komunikasi visual dirapikan</dt>
                  <dd className="text-sm text-slate-600">
                    Semua teks yang tidak required dihilangkan sehingga fokus utama tetap pada struktur menu dan hierarki modul.
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <footer className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm text-slate-700">
            Sidebar di sebelah kiri sudah mencerminkan konfigurasi final. Gunakan tampilan ini sebagai
            referensi ketika memvalidasi update di lingkungan staging ataupun produksi.
          </footer>
        </section>
      </main>
    </div>
  );
}
