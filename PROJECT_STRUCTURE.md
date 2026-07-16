# Dokumentasi Struktur Project LRTJ

Halo! Ini dokumentasi santai buat ngerti struktur project LRTJ. Anggap lagi jelasin ke temen yang baru pertama kali buka project ini.

---

## 1. STRUKTUR FOLDER UTAMA

**`app/`** — Isi semua halaman (pages) dan API routes. Di sini tempat tinggalnya halaman-halaman seperti Login, Dashboard, Merchandise, sama endpoint-endpoint API buat ambil/kirim data.

**`components/`** — Tempat komponen UI yang bisa dipakai ulang. Ada dua bagian: `ui/` (komponen dari shadcn/ui yang udah jadi) sama komponen custom bikinan kita sendiri kayak FilterSheet sama SidebarNavGroup.

**`lib/`** — File-file utilitas sama helper. Di sini ada `auth.ts` buat handle login/session, `prisma.ts` buat koneksi ke database, sama file-file pendukung lainnya.

**`prisma/`** — File konfigurasi Prisma ORM. `schema.prisma` di sini mendefinisikan model-model database yang ada. Prisma ini alat bantu buat kita nggak perlu nulis SQL manual.

**`public/`** — File-file statis kayak gambar, logo, favicon yang bisa diakses langsung lewat URL.

**`hooks/`** — Custom React hooks kayak `use-mobile.ts` buat deteksi apakah user lagi pakai HP atau desktop.

---

## 2. SETIAP HALAMAN (app/ folder)

### **Halaman Login (`app/login/page.tsx`)**
- **Nampilin apa:** Form login dengan email dan password, ada logo LRT Jakarta di atasnya. Background-nya foto stasiun LRT.
- **Data dari mana:** Ngirim data email/password ke NextAuth (lib/auth.ts) buat dicek. Kalau cocok sama akun demo (`adminlrtj@smk.belajar.id` / `123456`), user diarahin ke Dashboard.
- **Fitur:** Form login, toast notification yang nunjukin credentials demo otomatis, error handling kalau salah password.

### **Halaman Dashboard (`app/(main)/dashboard/page.tsx`)**
- **Nampilin apa:** Halaman utama setelah login. Ada banner "Welcome back" sama dua kartu highlight — satu buat Merchandise (total, active, inactive) sama satu buat Redeem Merchandise (total, pending, completed).
- **Data dari mana:** Manggil dua API: `GET /api/merchandise` buat ambil statistik merchandise, sama `GET /api/redeem` buat ambil statistik redeem.
- **Fitur:** Display statistik dalam bentuk kartu, loading skeleton sambil data diambil, responsive layout.

### **Halaman Merchandise (`app/(main)/merchandise/page.tsx`)**
- **Nampilin apa:** Halaman management merchandise. Ada tabel yang nampilin daftar merchandise (nama, poin, gambar, status, dll) sama form buat tambah/edit merchandise.
- **Data dari mana:** Manggil `GET /api/merchandise` buat ambil list merchandise. Buat tambah/edit/delete, manggil `POST /api/merchandise`, `PUT /api/merchandise/[id]`, sama `DELETE /api/merchandise/[id]`.
- **Fitur:** CRUD lengkap (Create, Read, Update, Delete), filter berdasarkan status (active/inactive), sorting berdasarkan berbagai kolom, search, toggle visibility kolom di tabel, responsive view (tabel di desktop, card di mobile).

### **Halaman Redeem Merchandise (`app/(main)/redeem-merchandise/page.tsx`)**
- **Nampilin apa:** Halaman management redeem/penukaran merchandise. Ada tabel yang nampilin daftar redeem (nama penerima, merchandise yang diredeem, status, dll) sama form buat edit status redeem.
- **Data dari mana:** Manggil `GET /api/redeem` buat ambil list redeem. Buat edit/delete, manggil `PUT /api/redeem/[id]` sama `DELETE /api/redeem/[id]`.
- **Fitur:** Read, Update, Delete redeem (Create biasanya dilakukan oleh user di sisi lain, bukan admin), filter berdasarkan status (process/completed/rejected), sorting, search (bisa cari nama penerima, nama merchandise, atau ID), pagination (karena datanya bisa banyak), autocomplete suggestions saat search.

---

## 3. SETIAP API ROUTE (app/api/ folder)

### **`/api/auth/[[...nextauth]]/route.ts`**
- **Buat apa:** Handle authentication NextAuth. Ini endpoint yang dipanggil saat login/logout.
- **Method:** GET (buat session check), POST (buat login).
- **Database:** Nggak langsung ke database — pakai credentials hardcode buat demo (email: `adminlrtj@smk.belajar.id`, password: `123456`).

### **`/api/merchandise/route.ts`**
- **Buat apa:** Endpoint buat kelola data merchandise.
- **Method:**
  - **GET** — Ambil semua data merchandise, support filter by status sama sorting. Return data + meta (total count, active count, inactive count).
  - **POST** — Tambah merchandise baru ke database.
- **Database:** Tabel `merchandise`.

### **`/api/merchandise/[id]/route.ts`**
- **Buat apa:** Endpoint buat kelola merchandise spesifik berdasarkan ID.
- **Method:**
  - **GET** — Ambil detail merchandise tertentu.
  - **PUT** — Update merchandise yang sudah ada.
  - **DELETE** — Hapus merchandise.
- **Database:** Tabel `merchandise`.

### **`/api/redeem/route.ts`**
- **Buat apa:** Endpoint buat kelola data redeem/penukaran merchandise.
- **Method:**
  - **GET** — Ambil list redeem, support filter by status, sorting, search, pagination. Ada juga mode debug (`?debug=status`) buat lihat distinct status values, sama mode suggest (`?suggest=query`) buat autocomplete suggestions.
  - **POST** — Tambah redeem baru (buat user, bukan admin).
- **Database:** Tabel `redeem` sama `merchandise` (buat join nama merchandise).

### **`/api/redeem/[id]/route.ts`**
- **Buat apa:** Endpoint buat kelola redeem spesifik berdasarkan ID.
- **Method:**
  - **PUT** — Update redeem (biasanya buat ganti status: process → completed/rejected).
  - **DELETE** — Hapus redeem.
- **Database:** Tabel `redeem`.

---

## 4. KOMPONEN PENTING (components/ folder, di luar folder ui/)

### **`SidebarNavGroup.tsx`**
- **Dipakai di mana:** Di layout utama (`app/(main)/layout.tsx`) sebagai bagian dari sidebar navigation.
- **Fungsinya apa:** Bikin navigasi di sidebar yang bisa collapse/expand. Ada item Dashboard sama Merchandise (yang punya sub-item: Merchandise sama Redeem Merchandise). Handle logic active state (menu mana yang lagi aktif berdasarkan URL sekarang), sama toggle buat expand/collapse sub-menu.
- **Kenapa dibikin komponen terpisah:** Biar rapi sama reusable. Kalau besok mau tambah menu baru di sidebar, tinggal tambah di NAV_ITEMS array di layout, komponen ini otomatis handle logic-nya.

### **`FilterSheet.tsx`**
- **Dipakai di mana:** Di halaman Merchandise (`MerchandiseContent.tsx`) sama Redeem Merchandise (`RedeemMerchandiseContent.tsx`).
- **Fungsinya apa:** Sheet (panel yang slide dari kanan) yang berisi form filter sama sort. User bisa pilih status (active/inactive/all), sort by (ID, created date, dll), sama order (ascending/descending). Ini bikin UI lebih clean daripada taruh semua filter di atas tabel.
- **Kenapa dibikin komponen terpisah:** Karena dipakai di dua tempat (Merchandise sama Redeem Merchandise) dengan logic yang mirip. Jadi nggak perlu copy-paste code, cukup panggil komponen ini sama kasih props yang sesuai.

---

## 5. FILE KONFIGURASI PENTING

### **`lib/auth.ts`**
- **Buat apa:** Konfigurasi NextAuth buat handle authentication. Di sini di-set provider Credentials (login dengan email/password), halaman login custom (`/login`), strategy session (JWT), sama callback-callback buat handle token sama session.
- **Catatan:** Sekarang pakai dummy authentication (hardcode credentials) buat demo. Di production nanti harusnya connect ke database user yang beneran.

### **`lib/prisma.ts`**
- **Buat apa:** Singleton instance dari PrismaClient. Ini file yang bikin koneksi ke database lewat Prisma ORM. Dipakai di semua API route buat query ke database.
- **Kenapa penting:** PrismaClient harus jadi singleton (satu instance aja) biar nggak kebanyakan koneksi ke database yang bisa bikin error "too many connections".

### **`prisma/schema.prisma`**
- **Buat apa:** File yang mendefinisikan model-model database. Di sini didefinisikan tabel-tabel apa aja yang ada di database (merchandise, redeem, member, dll), kolom-kolomnya apa, relasi antar tabel kayak apa.
- **Catatan penting:** Database ini legacy dari sistem Laravel (ada 70+ tabel). Jangan sembarangan ubah schema atau jalankan `prisma migrate reset` karena bisa hilangin data. Kalau butuh ubah struktur, harus hati-hati dan pakai `ALTER TABLE` manual.

### **`next.config.ts`**
- **Buat apa:** Konfigurasi Next.js. Di sini di-set `allowedDevOrigins` ke IP LAN (`172.16.12.230`) biar bisa diakses dari device lain di jaringan yang sama saat development.

### **`dev-with-lan.js`**
- **Buat apa:** Script custom buat jalankan dev server Next.js dengan dukungan LAN. Script ini otomatis deteksi IP address komputer, terus nampilkan URL Local (localhost:3000) sama URL LAN (http://IP-KOMPUTER:3000) di terminal.
- **Kenapa dipakai:** Supaya saat development, kita bisa buka aplikasi dari HP/device lain yang terhubung ke WiFi yang sama, bukan cuma dari komputer yang lagi jalanin server.

---

## 6. ALUR KERJA SECARA UMUM

Contoh alur lengkap dari user buka halaman Merchandise sampai data tampil:

1. **User buka `/merchandise`** di browser
2. **Next.js render halaman** `app/(main)/merchandise/page.tsx` yang cek session user dulu (kalau nggak login, dilempar ke login page)
3. **Session valid**, maka render `MerchandiseContent` component
4. **Component mount**, trigger `useEffect` yang manggil `fetch('/api/merchandise')`
5. **Request sampai ke API route** `app/api/merchandise/route.ts`
6. **API route baca query parameters** (status filter, sorting, dll) dari URL
7. **Prisma query ke database** tabel `merchandise` dengan filter/sorting yang sesuai
8. **Database return data**, API route kirim balik ke frontend dalam format JSON
9. **Frontend terima data**, simpan di state (`items`)
10. **Component render tabel** dengan data yang sudah diambil
11. **User bisa interaksi:** klik filter, search, tambah merchandise, dll — tiap aksi manggil API yang sesuai (POST/PUT/DELETE)

Alur yang sama berlaku buat halaman Redeem Merchandise, cuma beda API endpoint yang dipanggil (`/api/redeem`).

---

**Catatan penting:** Database ini adalah database production dari sistem lama (Laravel-based). Jangan sembarangan jalankan perintah yang bisa menghapus data atau merubah struktur database tanpa verifikasi yang teliti. Selalu cek AGENTS.md sebelum ngapa-ngapain yang berhubungan dengan database.
