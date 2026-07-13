export interface MerchandiseItem {
  id: number
  editedBy?: string
  name: string
  image_url: string
  points: number
  description: string
  createdAt: string
  updatedAt: string
  status: number // 1: Active, 0: Inactive
}

export const INITIAL_MERCHANDISE: MerchandiseItem[] = [
  {
    id: 4,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Mug Putih",
    image_url: "storage/2024/2/0c5ca311-7e85-4043-96fc-e29addfcd47b.jpeg",
    points: 300,
    description: "<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
    createdAt: "2024-02-09 10:19:40",
    updatedAt: "2024-09-19 08:06:55",
    status: 0
  },
  {
    id: 5,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Jersey Away Timnas Indonesia",
    image_url: "storage/2024/2/993d4dad-7e92-463c-9237-bf8e2c04d4f8.jpg",
    points: 800,
    description: "<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
    createdAt: "2024-02-09 10:35:56",
    updatedAt: "2024-09-19 08:06:52",
    status: 0
  },
  {
    id: 6,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Boneka Larata",
    image_url: "storage/2024/8/4b041894-724d-4c37-85de-43aec38f38da.png",
    points: 1300,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah diredeem tidak dapat dikembalikan</p>",
    createdAt: "2024-08-15 11:28:18",
    updatedAt: "2024-09-19 08:06:49",
    status: 0
  },
  {
    id: 7,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Jurnal Book",
    image_url: "storage/2024/8/1f31b42c-727b-4aa3-af88-343567a7f0da.png",
    points: 1150,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah diredeem tidak dapat dikembalikan</p>",
    createdAt: "2024-08-15 11:29:03",
    updatedAt: "2024-09-19 08:06:46",
    status: 0
  },
  {
    id: 8,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Sling Bag",
    image_url: "storage/2024/9/6e23b255-12a3-4701-80b6-44b414603562.png",
    points: 1050,
    description: "<p>1. Proses penukaran dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan penukaran</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan penukaran</p><p>4. Transaksi penukaran maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah di tukar tidak dapat dikembalikan</p>",
    createdAt: "2024-09-19 08:13:16",
    updatedAt: "2025-08-21 13:23:46",
    status: 0
  },
  {
    id: 9,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Jurnal Book",
    image_url: "storage/2024/9/e8058db6-44ca-4d2a-96ba-7a63c7a1a46c.png",
    points: 1150,
    description: "<p>&lt;ol&gt;</p><p>\t&lt;li&gt;Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta&lt;/li&gt;</p><p>\t&lt;li&gt;Pastikan poin anda cukup untuk melakukan redeem&lt;/li&gt;</p><p>\t&lt;li&gt;Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem&lt;/li&gt;</p><p>\t&lt;li&gt;Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda&lt;/li&gt;</p><p>\t&lt;li&gt;Poin yang sudah diredeem tidak dapat dikembalikan&lt;/li&gt;</p><p>&lt;/ol&gt;</p><p><br></p>",
    createdAt: "2024-09-19 08:15:50",
    updatedAt: "2024-09-19 08:16:50",
    status: 0
  },
  {
    id: 10,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Jurnal Book",
    image_url: "storage/2024/9/0900e7fa-1c90-4327-92fb-f080ff20b4d3.png",
    points: 1150,
    description: "<p>1. Proses penukaran dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan penukaran</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan penukaran</p><p>4. Transaksi penukaran maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah di tukar tidak dapat dikembalikan</p>",
    createdAt: "2024-09-19 08:16:44",
    updatedAt: "2024-09-19 08:17:21",
    status: 1
  },
  {
    id: 11,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Boneka LARATA",
    image_url: "storage/2024/9/22d4109b-c8f0-4b57-b642-651264ff69c0.png",
    points: 1300,
    description: "<p>1. Proses penukaran dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan penukaran</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan penukaran</p><p>4. Transaksi penukaran maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah di tukar tidak dapat dikembalikan</p>",
    createdAt: "2024-09-19 08:18:07",
    updatedAt: "2024-09-19 08:18:07",
    status: 1
  },
  {
    id: 12,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Tumblr Tematik",
    image_url: "storage/2024/9/0ce21005-d118-43ff-8a25-f336adaabf9e.png",
    points: 1250,
    description: "<p>1. Proses penukaran dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan penukaran</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan penukaran</p><p>4. Transaksi penukaran maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah di tukar tidak dapat dikembalikan</p>",
    createdAt: "2024-09-19 08:18:51",
    updatedAt: "2025-08-21 13:26:15",
    status: 0
  },
  {
    id: 13,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Jam Digital",
    image_url: "storage/2024/9/b5e849d4-a90d-4288-8346-55879f06b481.png",
    points: 1150,
    description: "<p>1. Proses penukaran dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan penukaran</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan penukaran</p><p>4. Transaksi penukaran maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah di tukar tidak dapat dikembalikan</p>",
    createdAt: "2024-09-19 08:19:26",
    updatedAt: "2024-09-19 08:19:26",
    status: 1
  },
  {
    id: 14,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Puzzle",
    image_url: "storage/2024/9/bdd0ef65-85e8-430e-bd21-44e24f4e10ee.png",
    points: 850,
    description: "<p>1. Proses penukaran dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan penukaran</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan penukaran</p><p>4. Transaksi penukaran maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah di tukar tidak dapat dikembalikan</p>",
    createdAt: "2024-09-19 08:19:53",
    updatedAt: "2024-09-19 08:19:53",
    status: 1
  },
  {
    id: 15,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Kartu Uang Elektronik",
    image_url: "storage/2024/10/cc551e5d-1a74-4b64-9242-133e4aec01a1.jpg",
    points: 900,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah direedem tidak dapat dikembalikan</p>",
    createdAt: "2024-09-01 04:53:01",
    updatedAt: "2025-08-21 13:27:43",
    status: 0
  },
  {
    id: 16,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Notebook",
    image_url: "storage/2024/10/c9c06a44-209b-4e86-8f07-b6a05f419bc7.jpg",
    points: 550,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah direedem tidak dapat dikembalikan</p>",
    createdAt: "2024-10-03 07:07:55",
    updatedAt: "2025-08-21 13:25:56",
    status: 0
  },
  {
    id: 17,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Shopping Bag",
    image_url: "storage/2024/10/dd5aacbf-e55c-44d4-91e9-7e7fc2977b7b.jpg",
    points: 350,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah direedem tidak dapat dikembalikan</p>",
    createdAt: "2024-10-03 07:08:27",
    updatedAt: "2025-08-21 13:26:31",
    status: 0
  },
  {
    id: 18,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "T-Shirt",
    image_url: "storage/2024/10/fab7048c-aed2-4b24-b3ab-217e89a884de.jpg",
    points: 750,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah direedem tidak dapat dikembalikan</p>",
    createdAt: "2024-10-03 07:08:53",
    updatedAt: "2025-08-21 13:24:01",
    status: 0
  },
  {
    id: 19,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Topi",
    image_url: "storage/2024/10/1d57e64f-f155-4e63-bfcd-a2aa3db2214c.jpg",
    points: 700,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah direedem tidak dapat dikembalikan</p>",
    createdAt: "2024-10-03 07:09:19",
    updatedAt: "2025-08-21 13:26:50",
    status: 0
  },
  {
    id: 20,
    editedBy: "itsupport.lrtj@lrtjakarta.co.id",
    name: "Tumbler",
    image_url: "storage/2024/10/b099289e-8922-4909-a3a1-ed8d0a75fa24.jpg",
    points: 1000,
    description: "<p>1. Proses redeem dapat dilakukan di seluruh stasiun LRT Jakarta</p><p>2. Pastikan poin anda cukup untuk melakukan redeem</p><p>3. Scan barcode pada QR code yang tersedia di Stasiun LRT Jakarta untuk melakukan redeem</p><p>4. Transaksi redeem point maksimal 3 item/hari dengan jenis item merchandise yang berbeda</p><p>5. Poin yang sudah direedem tidak dapat dikembalikan</p>",
    createdAt: "2024-10-03 07:11:36",
    updatedAt: "2025-08-21 13:27:00",
    status: 0
  },
  {
    id: 28,
    name: "Pasar Ramadhan (Dharma Jaya)",
    image_url: "storage/2025/4/e1324d91-68a8-4b24-a8bc-25f4e5953969.jpg",
    points: 100,
    description: "<ul><li>Voucher ini dapat ditukar dengan poin SLC maksimal 4 kali.</li><li>Setiap transaksi penukaran di tenant hanya berlaku untuk 1 voucher per produk.</li><li>Penukaran voucher di tenant Dharma Jaya di <strong>Stasiun Boulevard Utara Summarecon Mall</strong> pada tanggal 8 dan 10 Maret 2025 pukul 13.00 - 16.00 WIB</li></ul>",
    createdAt: "2025-03-07 10:07:14",
    updatedAt: "2025-04-21 08:37:16",
    status: 0
  },
  {
    id: 29,
    creator_email: "",
    name: "Pasar Ramadhan (Food Station)",
    image_url: "storage/2025/4/6bab57e7-2b12-4504-b2c5-67615c07b320.jpg",
    points: 100,
    description: "<ul><li>Voucher ini dapat ditukar dengan poin SLC maksimal 2 kali.</li><li>Setiap transaksi penukaran di tenant hanya berlaku untuk 1 voucher per produk.</li><li>Penukaran voucher di tenant Food Station di <strong>Stasiun Velodrome</strong> pada tanggal 9 Maret 2025 pukul 13.00 - 16.00 WIB</li></ul>",
    createdAt: "2025-03-07 10:10:21",
    updatedAt: "2025-04-21 08:36:58",
    status: 0
  },
  {
    id: 30,
    creator_email: "",
    name: "Pasar Ramadhan (Pasar Jaya)",
    image_url: "storage/2025/4/40f0900d-fac4-4ae2-b76b-344e46243c5a.jpg",
    points: 100,
    description: "<ul><li>Voucher ini dapat ditukar dengan poin SLC maksimal 2 kali.</li><li>Setiap transaksi penukaran di tenant hanya berlaku untuk 1 voucher per produk.</li><li>Penukaran voucher di tenant Pasar Jaya di Stasiun Velodrome pada tanggal 8 Maret 2025 pukul 13.00 - 16.00 WIB<br><br></li></ul>",
    createdAt: "2025-03-07 10:11:28",
    updatedAt: "2025-04-21 08:36:32",
    status: 0
  },
  {
    id: 31,
    creator_email: "",
    name: "#LRTJWomenFriendly",
    image_url: "storage/2025/4/78e5b875-007c-403c-88d0-fdaac9987cc8.png",
    points: 100,
    description: "<p>#LRTJWomenFriendly – Kegiatan Seru untuk Perempuan Berdaya<br>PAO Barat, Stasiun Velodrome LRT Jakarta<br>21 April 2025<br><br>Sebagai bentuk komitmen menghadirkan layanan transportasi publik yang nyaman, aman, dan ramah perempuan, LRT Jakarta mempersembahkan kegiatan seru dalam kampanye #LRTJWomenFriendly!<br><br>Unduh aplikasi LRTJ Apps, daftarkan dirimu sebagai member Sahabat LRTJ E-Card (SLC) dan dapatkan kesempatan mengambil 1 amplop dari Lucky Tree di area berbayar dekat loket Barat dengan menukarkan poin SLC.<br><br><br>Yuk, ikut jadi bagian dari gerakan #LRTJWomenFriendly dan nikmati pengalaman transportasi publik yang lebih inklusif dan penuh apresiasi!<br><br>#LRTJ #WomenFriendly #SahabatLRTJ #TransportasiAman #InklusifBersamaLRTJ</p>",
    createdAt: "2025-04-21 08:26:21",
    updatedAt: "2025-04-21 21:47:56",
    status: 0
  },
  {
    id: 35,
    creator_email: "",
    name: "Hari Angkutan Nasional",
    image_url: "storage/2025/4/1b48ba28-be19-4806-ae10-327ba1cc0a86.jpg",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan kupon bermain Lucky Tree</p><p>2. Promo hanya berlaku pada 24 April 2025 dalam rangka Hari Angkutan Nasional di Stasiun Velodrome LRT Jakarta&nbsp;</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon permainan selama periode berlangsung&nbsp;</p>",
    createdAt: "2025-04-24 08:15:47",
    updatedAt: "2025-04-25 09:01:01",
    status: 0
  },
  {
    id: 36,
    creator_email: "",
    name: "Cek Kesehatan Hari Angkutan Nasional",
    image_url: "storage/2025/4/0e823798-9d31-4d83-81f9-9a77b3579e29.jpg",
    points: 50,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan kupon Cek Kesehatan&nbsp;</p><p>2. Promo hanya berlaku pada 24 April 2025 dalam rangka Hari Angkutan Nasional di Stasiun Velodrome LRT Jakarta&nbsp;</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung&nbsp;</p>",
    createdAt: "2025-04-24 08:18:20",
    updatedAt: "2025-04-24 08:29:49",
    status: 0
  },
  {
    id: 37,
    creator_email: "",
    name: "Cek Kesehatan Hari Angkutan Nasional ",
    image_url: "storage/2025/4/78490ebc-9786-4830-86dd-233b7ccd9172.jpg",
    points: 50,
    description: "<p>1. Segera tukarkan 50 poin untuk mendapatkan kupon Cek Kesehatan&nbsp;</p><p>2. Promo hanya berlaku pada 24 April 2025 dalam rangka Hari Angkutan Nasional di Stasiun Velodrome LRT Jakarta&nbsp;</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung&nbsp;</p>",
    createdAt: "2025-04-24 08:30:56",
    updatedAt: "2025-04-24 14:22:42",
    status: 1
  },
  {
    id: 38,
    creator_email: "",
    name: "Merchandise SLC Pekan Imunisasi Dunia",
    image_url: "storage/2025/5/9d100605-0271-42f0-bd6c-d8d87fac2370.jpg",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 15 Mei 2025 dalam rangka Pekan Imunisasi Dunia di Stasiun Pegangsaan Dua</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung&nbsp;</p>",
    createdAt: "2025-05-15 07:40:20",
    updatedAt: "2025-05-16 14:45:02",
    status: 0
  },
  {
    id: 39,
    creator_email: "",
    name: "Merchandise SLC Warna Rasa",
    image_url: "storage/2025/5/715d9ed0-2b6a-41c3-a0aa-42845024865f.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 23 Mei 2025 dalam rangka Pekan Imunisasi Dunia di Stasiun Pegangsaan Dua</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-05-23 16:06:53",
    updatedAt: "2025-05-24 12:02:18",
    status: 0
  },
  {
    id: 40,
    creator_email: "",
    name: "Merchandise Jakcreatifest",
    image_url: "storage/2025/6/5c3414ed-35e5-4db2-a5bf-895362c1b13f.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 23 Mei 2025 dalam rangka Pekan Imunisasi Dunia di Stasiun Pegangsaan Dua</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-06-03 15:27:22",
    updatedAt: "2025-06-05 07:07:38",
    status: 0
  },
  {
    id: 41,
    creator_email: "",
    name: "Merchandise Hari Lanjut Usia Nasional",
    image_url: "storage/2025/6/3f15683a-2bfd-4958-b830-329c6c54478c.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 23 Mei 2025 dalam rangka Pekan Imunisasi Dunia di Stasiun Pegangsaan Dua</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-06-05 07:08:37",
    updatedAt: "2025-06-05 16:33:43",
    status: 0
  },
  {
    id: 42,
    creator_email: "",
    name: "Merchandise Khusus Transit Market",
    image_url: "storage/2025/6/a1d7497e-4956-475d-b75d-f4e0f8ed3b0a.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 22 Juni 2025 dalam Transit Market di Stasiun Velodrome</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-06-21 09:28:08",
    updatedAt: "2025-06-24 16:19:13",
    status: 0
  },
  {
    id: 43,
    creator_email: "",
    name: "Coto Daeng Tayang",
    image_url: "storage/2025/6/7943f936-a72c-4c26-aef4-8add83f4b0a6.png",
    points: 10,
    description: "<ul><li>Promo hanya berlaku untuk Member SLC</li><li>Promo ini hanya bisa digunakan 1 x dalam 1 hari&nbsp;</li><li>Promo tidak dapat digabungkan dengan promo lainnya</li></ul>",
    createdAt: "2025-06-24 16:26:46",
    updatedAt: "2025-07-04 11:04:23",
    status: 0
  },
  {
    id: 44,
    creator_email: "",
    name: "Merchandise Wara - Wiri Long Weekend",
    image_url: "storage/2025/6/6ac834a9-9b3c-49ce-b38a-8b2745096fb5.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 26 - 29 Juni 2025 dalam Wara - Wiri Long Weekend di Stasiun Velodrome</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-06-26 22:19:36",
    updatedAt: "2025-06-30 09:33:01",
    status: 0
  },
  {
    id: 45,
    creator_email: "",
    name: "Merchandise Wara - Wiri Special HUT Bhayangkara yang ke-79",
    image_url: "storage/2025/6/ab37c665-31fb-46f7-a7b7-e88885e9733d.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 1 Juli 2025 dalam Wara - Wiri Special Hut Bhayangkara yang ke-79 di Stasiun Velodrome</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-06-30 20:52:35",
    updatedAt: "2025-07-02 09:25:33",
    status: 0
  },
  {
    id: 46,
    creator_email: "",
    name: "Honey Loaf Bakery",
    image_url: "storage/2025/7/5750f782-f5c2-42ea-b3d3-e3d536ec4e9e.png",
    points: 10,
    description: "<p>1. Proses redeem dilakukan secara langsung di Store<br>2. Pastikan poin anda cukup untuk melakukan redeem<br>3. Promo hanya berlaku untuk Member SLC<br>4. Promo ini hanya bisa digunakan 1x dalam 1 hari<br>5. Promo tidak dapat digabungkan dengan promo lainnya</p><p><br></p>",
    createdAt: "2025-07-04 09:36:56",
    updatedAt: "2025-07-04 09:36:56",
    status: 1
  },
  {
    id: 47,
    creator_email: "",
    name: "Pastel Macik",
    image_url: "storage/2025/7/7e186ef0-d13a-451a-ae66-c36c141204ac.png",
    points: 10,
    description: "<p>1. Proses redeem dilakukan secara langsung di Store<br>2. Pastikan poin anda cukup untuk melakukan redeem<br>3. Promo hanya berlaku untuk Member SLC<br>4. Promo ini hanya bisa digunakan 1x dalam 1 hari<br>5. Promo tidak dapat digabungkan dengan promo lainnya</p>",
    createdAt: "2025-07-04 09:37:28",
    updatedAt: "2025-07-04 09:37:39",
    status: 1
  },
  {
    id: 48,
    creator_email: "",
    name: "Coto Daeng Tayang",
    image_url: "storage/2025/7/edf5d6db-6e8a-4110-858c-45dffa5086a6.png",
    points: 10,
    description: "<p>1. Proses redeem dilakukan secara langsung di Store<br>2. Pastikan poin anda cukup untuk melakukan redeem<br>3. Promo hanya berlaku untuk Member SLC<br>4. Promo ini hanya bisa digunakan 1x dalam 1 hari<br>5. Promo tidak dapat digabungkan dengan promo lainnya</p>",
    createdAt: "2025-07-04 11:06:51",
    updatedAt: "2025-07-04 11:06:51",
    status: 1
  },
  {
    id: 49,
    creator_email: "",
    name: "Merchandise Wara-Wiri Pre-Event IGW",
    image_url: "storage/2025/7/58b9a32a-f36b-4748-8967-966cbb5cfd0b.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 1 Juli 2025 dalam Pre-Event IGW di Stasiun Pulomas</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-07-05 10:14:43",
    updatedAt: "2025-07-08 09:49:22",
    status: 0
  },
  {
    id: 50,
    creator_email: "",
    name: "Redeem Merchandise Edutour Yummy Bites",
    image_url: "storage/2025/7/46769b7a-57d4-4a30-9140-0414d1fb16da.png",
    points: 100,
    description: "<p>1. Segera tukarkan 100 poin untuk mendapatkan merchandise menarik&nbsp;</p><p>2. Promo hanya berlaku pada 23 Juli 2025 dalam kegiatan Edutour Yummy Bites di Stasiun Pegangsaan DUa</p><p>3. Setiap peserta berkesempatan menukarkan 1x kupon selama periode berlangsung</p>",
    createdAt: "2025-07-23 08:22:54",
    updatedAt: "2025-07-28 09:32:15",
    status: 0
  },
  {
    id: 51,
    creator_email: "",
    name: "Martha Tilaar",
    image_url: "storage/2025/7/0aec7e41-0779-40ff-9607-cedb728b2718.png",
    points: 100,
    description: "<p>Diskon Reguler 10% maksimal Rp.1.000.000 (100 poin)</p><p>Untuk Syarat &amp; Ketentuan pada LRTJ Apps :</p><p>- Proses redeem dilakukan secara langsung di Store&nbsp;</p><p>- Pastikan poin anda cukup untuk melakukan redeem</p><p>- Promo hanya berlaku untuk Member SLC&nbsp;</p><p>- Promo ini hanya bisa digunakan 1x dalam 1 hari&nbsp;</p><p>- Promo tidak dapat digabungkan dengan promo lainnya</p><p>- Berlaku untuk Transaksi Minimal Rp 650.000 pada setiap tanggal 4-27 setiap bulannya</p><p>&nbsp;</p><p>Diskon Payday 15% maksimal Rp.1.000.000 (125 poin)</p><p>Untuk Syarat &amp; Ketentuan pada LRTJ Apps :</p><p>- Proses redeem dilakukan secara langsung di Store&nbsp;</p><p>- Pastikan poin anda cukup untuk melakukan redeem</p><p>- Promo hanya berlaku untuk Member SLC&nbsp;</p><p>- Promo ini hanya bisa digunakan 1x dalam 1 hari&nbsp;</p><p>- Promo tidak dapat digabungkan dengan promo lainnya</p><p>- Berlaku untuk Transaksi Minimal Rp 650.000 pada setiap tanggal 28-3 setiap bulannya</p>",
    createdAt: "2025-07-28 09:33:28",
    updatedAt: "2025-07-28 09:54:39",
    status: 1
  },
  {
    id: 52,
    creator_email: "",
    name: "Rumah Makan Sederhana",
    image_url: "storage/2025/7/9deffe3b-da83-4946-9a80-b90a20df7d9e.png",
    points: 10,
    description: "<p>RM Sederhana&nbsp;<br>Untuk Syarat &amp; Ketentuan pada LRTJ Apps :<br><br>- Proses redeem dilakukan secara langsung di Store&nbsp;<br>- Pastikan poin anda cukup untuk melakukan redeem<br>- Promo hanya berlaku untuk Member SLC&nbsp;<br>- Hanya berlaku untuk Promo 9 Menu Sarapan dimulai pada jam 07.00 - 10.00 setiap harinya<br>- Promo ini hanya bisa digunakan 1x dalam 1 hari&nbsp;<br>- Promo tidak dapat digabungkan dengan&nbsp;promo&nbsp;lainnya</p>",
    createdAt: "2025-07-28 09:44:53",
    updatedAt: "2025-07-29 15:42:18",
    status: 0
  },
  {
    id: 53,
    creator_email: "",
    name: "#CobainJadiMasinis di Indonesia Game Week",
    image_url: "storage/2025/8/e02f0deb-9e11-4d10-9af2-dd89f09cdf9d.png",
    points: 100,
    description: "<p>Rasakan Serunya #CobainJadiMasinis di Indonesia Game Week</p><p>Mainkan Train Simulator &amp; Ikuti Kompetisinya</p>",
    createdAt: "2025-08-06 14:52:45",
    updatedAt: "2025-08-13 08:46:31",
    status: 0
  },
  {
    id: 54,
    creator_email: "",
    name: "#TrainCompetition di Indonesia Game Week 2025",
    image_url: "storage/2025/8/5d1359a0-4797-479a-9de4-b708b0f297b4.png",
    points: 100,
    description: "<p>Tukarkan poin mu untuk mengikuti Train Simulator Competition</p>",
    createdAt: "2025-08-06 16:28:19",
    updatedAt: "2025-08-13 08:46:22",
    status: 0
  },
  {
    id: 55,
    creator_email: "",
    name: "#Wara-Wiri Riang Riuh 17 Agustus 2025",
    image_url: "storage/2025/8/1aefca8d-4c6d-4edf-b11c-442966a09470.jpg",
    points: 100,
    description: "<p>Tukarkan poin mu dengan exclusive merchandise dari aktivasi kegiatan Wara-WIri RIang Riuh LRT Jakarta di St. Velodrome.</p>",
    createdAt: "2025-08-17 08:18:52",
    updatedAt: "2025-08-18 09:44:18",
    status: 0
  },
  {
    id: 56,
    creator_email: "",
    name: "#Wara-Wiri Riang Riuh 18 Agustus 2025",
    image_url: "storage/2025/8/5a14ab60-c112-4749-b5e2-1511fe7e1994.jpg",
    points: 10,
    description: "<p>Tukarkan poinmu dengan merchandise menarik di stasiun Velodrome LRT Jakarta</p>",
    createdAt: "2025-08-18 09:45:44",
    updatedAt: "2025-08-19 09:43:28",
    status: 0
  },
  {
    id: 57,
    creator_email: "",
    name: "RM Sederhana",
    image_url: "storage/2025/8/4c46d7cc-33de-4dcc-9140-2478320ba01d.jpg",
    points: 10,
    description: "<p>Syarat &amp; Ketentuan:<br><br>- Proses redeem dilakukan secara langsung di Store&nbsp;<br>- Pastikan poin anda cukup untuk melakukan redeem<br>- Promo hanya berlaku untuk Member SLC&nbsp;<br>- Hanya berlaku untuk Promo 9 Menu Sarapan dimulai pada jam 07.00 - 10.00 setiap harinya<br>- Promo ini hanya bisa digunakan 1x dalam 1 hari&nbsp;<br>- Promo tidak dapat digabungkan dengan promo lainnya</p>",
    createdAt: "2025-08-20 09:40:30",
    updatedAt: "2025-08-20 09:53:22",
    status: 1
  }
]
