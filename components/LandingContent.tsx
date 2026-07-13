"use client"

import { useState } from "react"

const stations = [
  { id: 1, name: "Pegangsaan Dua", code: "LJ01" },
  { id: 2, name: "Boulevard Utara", code: "LJ02" },
  { id: 3, name: "Boulevard Selatan", code: "LJ03" },
  { id: 4, name: "Pulomas", code: "LJ04" },
  { id: 5, name: "Equestrian", code: "LJ05" },
  { id: 6, name: "Velodrome", code: "LJ06" },
  { id: 7, name: "Pacuan Kuda", code: "LJ07" },
  { id: 8, name: "Cempaka Putih", code: "LJ08" },
  { id: 9, name: "Sentra Timur", code: "LJ09" },
  { id: 10, name: "Jatimulya", code: "LJ10" },
  { id: 11, name: "Cikunir", code: "LJ11" },
  { id: 12, name: "Bekasi Barat", code: "LJ12" },
]

const schedules = [
  { time: "05:00", destination: "Pegangsaan Dua → Bekasi Barat", status: "Tepat Waktu" },
  { time: "05:30", destination: "Bekasi Barat → Pegangsaan Dua", status: "Tepat Waktu" },
  { time: "06:00", destination: "Pegangsaan Dua → Bekasi Barat", status: "Tepat Waktu" },
  { time: "06:30", destination: "Bekasi Barat → Pegangsaan Dua", status: "Tepat Waktu" },
  { time: "07:00", destination: "Pegangsaan Dua → Bekasi Barat", status: "Padat" },
  { time: "07:30", destination: "Bekasi Barat → Pegangsaan Dua", status: "Padat" },
]

const faqs = [
  {
    q: "Berapa harga tiket LRT Jakarta?",
    a: "Tarif LRT Jakarta dimulai dari Rp 5.000 untuk 1 stasiun dan bertambah sesuai jarak. Tarif maksimum adalah Rp 24.000 untuk keseluruhan rute.",
  },
  {
    q: "Bagaimana cara membeli tiket LRT Jakarta?",
    a: "Tiket dapat dibeli melalui mesin tiket di stasiun, aplikasi mobile JakLingko, atau menggunakan kartu uang elektronik (e-money) dari berbagai bank.",
  },
  {
    q: "Jam operasional LRT Jakarta?",
    a: "LRT Jakarta beroperasi setiap hari mulai pukul 05.00 WIB hingga 23.00 WIB dengan interval keberangkatan setiap 10–15 menit.",
  },
  {
    q: "Apakah LRT Jakarta terhubung dengan moda transportasi lain?",
    a: "Ya! LRT Jakarta terhubung dengan TransJakarta, KRL Commuterline, dan MRT Jakarta di beberapa titik interchange untuk kemudahan perjalanan Anda.",
  },
]

const features = [
  {
    icon: "🚆",
    title: "Cepat & Tepat Waktu",
    desc: "Kereta modern dengan jadwal yang teratur dan tepat waktu setiap harinya.",
  },
  {
    icon: "❄️",
    title: "Nyaman & Ber-AC",
    desc: "Gerbong kereta dilengkapi AC dan tempat duduk yang nyaman untuk semua penumpang.",
  },
  {
    icon: "🛡️",
    title: "Aman & Terpercaya",
    desc: "Dilengkapi CCTV dan petugas keamanan di setiap stasiun selama operasional.",
  },
  {
    icon: "♿",
    title: "Ramah Difabel",
    desc: "Fasilitas khusus seperti lift, ramp, dan tempat duduk prioritas tersedia di semua stasiun.",
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* Quick Info Bar */}
      <div className="bg-[#333333] text-white text-sm py-2 px-6 flex justify-center gap-8 flex-wrap">
        <span className="flex items-center gap-2">
          <span className="text-[#E5262C]">●</span> Operasional: 05.00 – 23.00 WIB
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[#BD8226]">●</span> 12 Stasiun Aktif
        </span>
        <span className="flex items-center gap-2">
          <span className="text-green-400">●</span> Status Sistem: Normal
        </span>
      </div>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#E5262C]/10 text-[#E5262C] text-xs font-semibold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
              Mengapa LRT Jakarta?
            </span>
            <h2 className="text-3xl font-bold text-[#333333]">Transportasi Masa Depan Jakarta</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              LRT Jakarta hadir sebagai solusi transportasi perkotaan yang modern, efisien, dan ramah lingkungan.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-gray-50 hover:bg-[#E5262C] rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-[#333333] group-hover:text-white mb-2 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Route Map Section */}
      <section className="py-16 px-6 bg-[#F8F8F8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#BD8226]/10 text-[#BD8226] text-xs font-semibold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
              Peta Rute
            </span>
            <h2 className="text-3xl font-bold text-[#333333]">Stasiun LRT Jakarta</h2>
            <p className="text-gray-500 mt-3">Rute Pegangsaan Dua — Bekasi Barat (Fase 1)</p>
          </div>

          {/* Station Line */}
          <div className="relative overflow-x-auto pb-4">
            <div className="flex items-center min-w-max mx-auto px-8">
              {stations.map((station, index) => (
                <div key={station.id} className="flex items-center">
                  <div className="flex flex-col items-center group cursor-default">
                    <div className="w-10 h-10 rounded-full bg-white border-4 border-[#E5262C] flex items-center justify-center shadow-md group-hover:bg-[#E5262C] transition-colors duration-200 z-10">
                      <span className="text-[10px] font-bold text-[#E5262C] group-hover:text-white transition-colors">{station.code.replace("LJ", "")}</span>
                    </div>
                    <span className="mt-2 text-[11px] font-medium text-[#333333] text-center max-w-[80px] leading-tight">{station.name}</span>
                  </div>
                  {index < stations.length - 1 && (
                    <div className="w-12 h-1 bg-[#E5262C] mx-1 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#E5262C]/10 text-[#E5262C] text-xs font-semibold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
              Jadwal Kereta
            </span>
            <h2 className="text-3xl font-bold text-[#333333]">Jadwal Keberangkatan Hari Ini</h2>
            <p className="text-gray-500 mt-3">Jadwal keberangkatan awal hari ini (data sampel prototype)</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#333333] to-[#E5262C] text-white">
                  <th className="py-4 px-6 text-left font-semibold">Waktu</th>
                  <th className="py-4 px-6 text-left font-semibold">Rute</th>
                  <th className="py-4 px-6 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s, i) => (
                  <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="py-4 px-6 font-bold text-[#333333]">{s.time}</td>
                    <td className="py-4 px-6 text-gray-600">{s.destination}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                        s.status === "Tepat Waktu"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How to Buy Ticket */}
      <section className="py-16 px-6 bg-gradient-to-br from-[#333333] to-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#E5262C]/30 text-red-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
              Cara Naik LRT
            </span>
            <h2 className="text-3xl font-bold">Mudah, Cepat, Terjangkau</h2>
            <p className="text-white/60 mt-3">Hanya 4 langkah untuk menikmati perjalanan dengan LRT Jakarta</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Datang ke Stasiun", desc: "Temukan stasiun LRT Jakarta terdekat dari lokasi Anda.", icon: "📍" },
              { step: "02", title: "Beli / Tap Tiket", desc: "Beli tiket di mesin atau tap kartu e-money Anda.", icon: "💳" },
              { step: "03", title: "Masuk Peron", desc: "Tap kartu atau scan QR code di pintu masuk peron.", icon: "🚪" },
              { step: "04", title: "Nikmati Perjalanan", desc: "Naik kereta dan nikmati perjalanan yang nyaman!", icon: "🚆" },
            ].map((item) => (
              <div key={item.step} className="relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E5262C] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {item.step}
                </div>
                <div className="text-3xl mt-4 mb-3">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#BD8226]/10 text-[#BD8226] text-xs font-semibold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
              Bantuan
            </span>
            <h2 className="text-3xl font-bold text-[#333333]">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-[#333333] hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className={`text-[#E5262C] text-xl transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="text-lg font-bold text-white mb-1">LRT Jakarta</div>
            <div className="text-sm text-white/40">Prototype Portal Transportasi Umum — Proyek PKL</div>
          </div>
          <div className="text-xs text-white/30 text-center md:text-right">
            © {new Date().getFullYear()} LRT Jakarta. Prototype — Bukan untuk publikasi resmi.
          </div>
        </div>
      </footer>
    </>
  )
}
