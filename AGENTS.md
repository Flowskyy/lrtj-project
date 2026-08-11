# AGENTS.md

Instruksi ini berlaku untuk semua AI coding agent (Devin, Cascade, Cursor, dll)
yang bekerja di project **lrtj-project**. Wajib dibaca dan dipatuhi sebelum
melakukan perubahan apapun.

## 📁 Folder `.devin/` — WAJIB DIBACA

Project ini punya folder `.devin/` di root yang isinya **skills** —
panduan teknis spesifik tentang project ini (cara kerja fitur tertentu,
konvensi kode, cara handle kasus-kasus khusus di codebase ini). Sebelum
mengerjakan task apapun:

1. Cek folder `.devin/` dan baca skill yang relevan dengan task yang lagi
   dikerjakan.
2. Kalau ada skill yang cocok dengan task ini, **ikuti panduan di skill
   itu** — jangan diabaikan atau ditimpa dengan asumsi/cara sendiri.
3. Kalau tidak yakin skill mana yang relevan, sebutkan skill apa saja yang
   ada di `.devin/` dan tanya ke user sebelum lanjut, daripada menebak.
4. Prioritas: instruksi di AGENTS.md ini > skill relevan di `.devin/` >
   asumsi/default milik agent sendiri.

## 🚫 Aturan Database — WAJIB, TIDAK BOLEH DILANGGAR

1. **JANGAN PERNAH** menjalankan perintah yang bisa menghapus data, termasuk:
   - `prisma migrate reset`
   - `prisma db push --force-reset`
   - `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`
2. Database ini dikelola oleh sistem lama berbasis Laravel (ada tabel
   `migrations`, `failed_jobs`, `job_batches`, dll — total 70+ tabel).
   **JANGAN** pakai `prisma migrate dev` untuk mengubah struktur database ini,
   karena Prisma akan mencoba menyamakan seluruh migration history dan bisa
   menawarkan reset total. Kalau memang perlu ubah struktur, pakai
   `ALTER TABLE` manual yang direview dulu.
3. **JANGAN LANGSUNG ASUMSI perlu kolom baru** kalau ada error
   "column does not exist". Investigasi dulu:
   - Jalankan `npx prisma db pull` (read-only) untuk lihat struktur tabel
     yang sebenarnya.
   - Cek apakah field yang dicari sebenarnya sudah ada tapi dengan nama
     berbeda (naming mismatch, misalnya camelCase di kode vs snake_case di
     database — contoh kasus nyata: `description` di kode ternyata sudah ada
     di database dengan nama kolom `term_condition`, `points` ada sebagai
     `redeem_point`).
   - Kalau ternyata cuma beda nama, solusinya pakai `@map()` directive di
     schema.prisma — **bukan** bikin kolom baru atau migration apapun.
4. Laporkan hasil investigasi dulu (struktur tabel asli + analisis mismatch)
   sebelum eksekusi apapun. Kasih beberapa opsi solusi, tunggu approval user,
   baru jalankan.
5. Kalau memang harus nambah kolom baru (setelah dipastikan bukan cuma
   masalah naming), gunakan `prisma migrate dev --create-only` dulu supaya
   file migration bisa direview manual, tampilkan SQL-nya, baru dieksekusi
   setelah user approve.
6. Setelah migration/schema change dijalankan, verifikasi data tidak hilang
   (count sebelum & sesudah, cek data masih bisa diquery normal).
7. Kalau ragu apakah suatu perintah aman untuk data yang sudah ada,
   **STOP dan tanya user dulu**, jangan diasumsikan aman.

## ⏰ Timestamp / WIB Convention — WAJIB, TIDAK BOLEH DILANGGAR

1. **SEMUA field timestamp** yang ditulis oleh aplikasi ini (createdAt, updatedAt,
   lastSeen, revertedAt, dan field DateTime lainnya) **WAJIB** digenerate menggunakan
   helper app-side `getWIBDate()` dari `lib/utils.ts`. Helper ini mengembalikan
   JavaScript Date object yang merepresentasikan waktu WIB yang benar
   (Asia/Jakarta, UTC+7).

2. **JANGAN PERNAH** pakai attribute Prisma `@default(now())` atau `@updatedAt`
   untuk field DateTime di project ini. Attribute ini resolve ke MySQL's server-side
   NOW(), yang mengembalikan UTC/SYSTEM timezone di server database project ini,
   bukan WIB. Alasannya: MySQL session/global time_zone di database ini adalah
   'SYSTEM', bukan Asia/Jakarta, dan mengubah itu secara sengaja dihindari demi
   kontrol timestamp app-side.

3. **JANGAN PERNAH** pakai fungsi waktu SQL mentah (NOW(), CURRENT_TIMESTAMP(),
   UTC_TIMESTAMP(), CONVERT_TZ(...), dll) di manual migration atau raw query apapun
   untuk kolom timestamp project ini. Kalau raw SQL insert butuh timestamp, pakai
   hardcoded literal WIB value, atau lebih baik jalankan logic set-timestamp lewat
   Prisma/app code menggunakan `getWIBDate()` alih-alih raw SQL.

4. Kalau butuh versi STRING formatted untuk display (bukan untuk tulis ke field
   Prisma DateTime), gunakan helper display-formatting terpisah:
   `formatWIBDate()` dari `lib/formatWIBDate.ts`. **JANGAN PERNAH** masukkan string
   formatted ke field Prisma DateTime — hanya Date object asli dari `getWIBDate()`
   yang boleh.

5. Convention ini strict karena ini sumber bug berulang di sesi sebelumnya:
   mencampur sumber timestamp DB-side dan app-side menyebabkan perbedaan ~7 jam
   di beberapa tabel.

## 🎨 Design System / UI Guidelines

- **Font wajib: Plus Jakarta Sans** untuk seluruh aplikasi, load via
  `next/font/google`, set sebagai default font di `tailwind.config` /
  `globals.css`. Sebelum apply, cek dulu font yang sudah dipakai di halaman
  Landing/Auth — kalau ternyata sudah pakai font tertentu yang konsisten,
  konfirmasi dulu ke user sebelum mengganti semuanya ke Plus Jakarta Sans.

- **Brand color: MERAH LRT Jakarta — WAJIB DIPERTAHANKAN.**
  Landing dan Auth page sudah punya identitas brand merah yang benar dan
  sudah bagus. **JANGAN** ganti ke tema grayscale/neutral generik.
  Sebelum redesign halaman lain (Dashboard, Merchandise, dll), inspeksi dulu
  nilai warna (hex), font-family, border-radius, dan shadow yang sudah
  didefinisikan di Landing/Auth, lalu **reuse nilai yang sama** — jangan
  menebak/membuat warna baru sendiri.

- Dashboard & halaman admin lainnya saat ini terlihat seperti template admin
  generik (red block penuh di sidebar/header, tabel default tanpa spacing).
  Tujuan redesign adalah menyamakan level polish-nya dengan Landing/Auth,
  BUKAN mengganti identitas warna. Prinsip penerapan warna merah yang benar:
  - Merah dipakai untuk: primary action button, active nav state, key
    highlight/badge — bukan sebagai blok solid penuh di background
    sidebar/header.
  - Sidebar & header: background putih/netral terang, border tipis subtle,
    merah hanya di elemen aksen (icon aktif, tombol utama).
  - Card putih/netral dengan shadow halus, konsisten dengan gaya section di
    Landing page.

- Layout & komponen:
  - Spacing lega, tidak cramped (bandingkan dengan breathing room di
    Landing/Auth sebagai acuan).
  - Hierarchy tipografi jelas: page title, section heading, body text, tabel
    — masing-masing beda weight/size.
  - Stat card (angka highlight) dibuat sebagai card terpisah dengan
    icon+label+angka, bukan kotak inline polos.
  - Table: row height cukup, hover state halus, status ditampilkan sebagai
    badge/pill berwarna, bukan teks polos berwarna.
  - Button: radius & sizing konsisten dengan tombol yang sudah ada di
    Landing/Auth (misalnya tombol "Login").
  - Rounded corners konsisten (`rounded-lg`/`rounded-xl`), shadow halus saja
    (hindari shadow tebal/norak).
  - Wajib responsive (mobile-friendly).
  - Kalau project sudah pakai shadcn/ui atau Tailwind convention tertentu,
    ikuti itu — jangan bikin pola/style baru yang beda sendiri.

- Kalau sedang redesign UI, **jangan ubah logic/business function** yang
  sudah jalan kecuali memang diminta. Fokus di layer styling/komponen saja.
  **Jangan sentuh** halaman Landing/Auth — itu sudah jadi acuan referensi,
  bukan target redesign.

## ✅ Workflow yang Diharapkan

1. Cek dulu skill relevan di `.devin/`, lalu investigasi/inspeksi (struktur
   DB, atau styling existing di Landing/Auth) sebelum eksekusi apapun —
   laporkan temuan dan opsi solusi, tunggu approval user, baru jalankan.
2. Kalau ada bug terkait database/schema, selesaikan itu dulu dan minta
   approval user sebelum lanjut ke task lain (misalnya redesign UI).
3. Untuk redesign UI: fix shared layout (sidebar/header) dulu, baru halaman
   spesifik (misalnya Merchandise) di atas layout yang sudah diperbarui.
4. Tunjukkan preview/screenshot sebelum finalisasi perubahan besar.
5. Commit kecil & jelas, satu concern per commit kalau memungkinkan.