# 🏪 Warung POS — Sistem Kasir Modern untuk Warung

> Aplikasi kasir mobile offline-first untuk warung kecil: kasir cepat, kelola produk, riwayat transaksi, dan cetak struk 58mm.
>
> *A mobile offline-first POS app for small stalls: fast checkout, product management, transaction history, and 58mm receipt printing.*

[![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)](https://reactnative.dev)
[![SQLite](https://img.shields.io/badge/SQLite-local-green?logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?logo=supabase)](https://supabase.com)
[![Zustand](https://img.shields.io/badge/Zustand-state-orange)](https://zustand-demo.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 📖 Tentang / About

**Indonesia:**
Warung POS adalah aplikasi Point of Sale (POS) berbasis Expo (React Native) yang dirancang untuk warung kelontong dan jajanan. Data transaksi dan produk tersimpan lokal memakai SQLite sehingga tetap jalan tanpa internet. Supabase hanya dipakai untuk autentikasi (login username + PIN).

**English:**
*Warung POS is an Expo-based Point of Sale app built for small grocery stalls and snack shops. Transactions and products are stored locally with SQLite so it works offline. Supabase is only used for authentication (username + PIN login).*

---

## ✨ Fitur Utama / Key Features

| # | Indonesia | English |
|---|-----------|---------|
| 1 | **Kasir cepat** — tombol harga cepat Rp 1.000–5.000, harga custom, tambah produk dari katalog, search, dan keranjang dengan qty +/− | *Fast checkout — quick-price buttons IDR 1,000–5,000, custom price, add catalog products, search, cart with qty controls* |
| 2 | **Kelola produk (CRUD)** — tambah, edit, hapus (soft delete), kategori, search, dan 16 produk default saat instalasi pertama | *Product CRUD — create, update, soft delete, categories, search, 16 seeded default products* |
| 3 | **Riwayat transaksi** — daftar terbaru, search by ID/tanggal/jam/item/total, detail modal, export struk ke PDF | *Transaction history — latest-first list, search by ID/date/time/item/total, detail modal, PDF receipt export* |
| 4 | **Cetak struk 58mm** — template HTML thermal printer via `expo-print` + `expo-sharing` | *58mm receipt printing — thermal-printer HTML template via `expo-print` + `expo-sharing`* |
| 5 | **Login username + PIN** — autentikasi via Supabase RPC, sesi tersimpan di AsyncStorage, auto-redirect | *Username + PIN login — Supabase RPC auth, session persisted in AsyncStorage, auto-redirect* |
| 6 | **Offline-first** — database lokal `warung_pos.db`, tanpa backend wajib selain auth | *Offline-first — local `warung_pos.db`, no mandatory backend besides auth* |
| 7 | **Design system sendiri** — palet olive `#9CAB84` + cream `#F6F0D7`, spacing 8px, shadows, tipografi konsisten | *Built-in design system — olive `#9CAB84` + cream `#F6F0D7` palette, 8px spacing, shadows, consistent typography* |

---

## 🧱 Tech Stack

| Teknologi / Technology | Versi / Version | Fungsi / Role |
|---|---|---|
| Expo | ~54 | Framework + build (EAS) |
| React / React Native | 19.1.0 / 0.81.5 | UI |
| expo-router | ~6 | File-based routing + tab navigation |
| expo-sqlite | ~16 | Database lokal / local database |
| @supabase/supabase-js | ^2 | Auth (RPC login) |
| zustand | ^5 | State keranjang + sesi / cart + session state |
| AsyncStorage | 2.2.0 | Persistensi sesi / session persistence |
| expo-print + expo-sharing | ~15 / ~14 | Cetak & share struk PDF / print & share PDF receipts |

---

## 🏗️ Struktur Proyek / Project Structure

```text
kasir-warung/
├── app/
│   ├── _layout.js          # init DB + auth guard + redirect login
│   ├── login.js            # layar login username + PIN
│   └── (tabs)/
│       ├── index.js        # layar kasir (quick price + katalog + cart + checkout)
│       ├── products.js     # CRUD produk + kategori + search
│       └── history.js      # riwayat transaksi + detail + export PDF
├── database/
│   ├── service.js          # tabel `transaksi`, simpan/ambil/hapus transaksi
│   └── productService.js   # tabel `products`, CRUD + seed 16 produk default
├── store/
│   ├── cartStore.js        # zustand: items jajanan/produk, total, checkout
│   └── authStore.js        # zustand: login RPC, load/clear session
├── utils/
│   ├── supabaseClient.js   # supabase client (baca dari env)
│   ├── authSession.js      # get/set/clear session di AsyncStorage
│   └── receiptTemplate.js  # template HTML struk 58mm
├── constants/theme.ts      # design tokens (Colors, Typography, Spacing, Shadows)
├── app.json                # Expo config (nama, slug, scheme, splash, sqlite plugin)
└── eas.json                # profil build development/preview/production
```

**Alur data / Data flow:**
`Kasir UI → cartStore (zustand) → simpanTransaksi (SQLite) → riwayat ← ambilSemuaTransaksi`
*`Cashier UI → cartStore (zustand) → simpanTransaksi (SQLite) → history ← ambilSemuaTransaksi`*

---

## 🗄️ Skema Database / Database Schema

**Indonesia:** dua tabel di satu file `warung_pos.db`. Tidak ada migrasi — tabel dibuat otomatis via `CREATE TABLE IF NOT EXISTS` saat aplikasi pertama dibuka.

**English:** *two tables in a single `warung_pos.db` file. No migrations — tables are auto-created with `CREATE TABLE IF NOT EXISTS` on first launch.*

**Tabel `transaksi`:**

| Kolom / Column | Tipe / Type | Keterangan / Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | ID transaksi / transaction ID |
| total_harga | REAL NOT NULL | Total belanja / grand total |
| daftar_barang | TEXT NOT NULL | JSON array `{tipe, nama, qty, harga, subtotal}` |
| waktu_transaksi | TEXT NOT NULL | ISO string |

**Tabel `products`:**

| Kolom / Column | Tipe / Type | Keterangan / Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | ID produk / product ID |
| nama | TEXT NOT NULL | Nama produk / product name |
| harga | REAL NOT NULL | Harga satuan / unit price |
| kategori | TEXT DEFAULT 'Umum' | Kategori / category |
| stok | INTEGER NULL | Opsional, belum dipakai UI / optional, unused by UI |
| aktif | INTEGER DEFAULT 1 | 1 aktif, 0 terhapus (soft delete) / 1 active, 0 soft-deleted |
| created_at / updated_at | TEXT NOT NULL | ISO string |

---

## 🚀 Cara Menjalankan / Getting Started

### Prasyarat / Prerequisites

- Node.js LTS + npm
- Aplikasi **Expo Go** di HP (atau Android emulator / iOS simulator)
- Akun Supabase (hanya untuk auth — bukan untuk data transaksi)

### 1. Install

```bash
npm install
```

### 2. Konfigurasi env / Configure env

**Indonesia:** salin `.env.example` menjadi `.env`, lalu isi dua variabel di bawah. Nilai key diambil dari dashboard Supabase project kamu (jangan commit file `.env`).

**English:** *copy `.env.example` to `.env`, then fill the two variables below. Get the values from your Supabase project dashboard (never commit `.env`).*

```bash
cp .env.example .env
```

| Variabel / Variable | Wajib / Required | Keterangan / Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Ya / Yes | URL project Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Ya / Yes | Anon/public key Supabase |

> Tanpa env ini aplikasi tetap terbuka, tapi login akan gagal dengan pesan "Supabase belum dikonfigurasi".
> *Without these, the app still opens, but login fails with "Supabase belum dikonfigurasi".*

Fungsi login memanggil RPC `login_user(p_username, p_pin)` — buat RPC tersebut di project Supabase kamu dengan return kolom `id` dan `username`.

*Login calls RPC `login_user(p_username, p_pin)` — create that RPC in your Supabase project returning `id` and `username` columns.*

### 3. Jalankan / Run

```bash
npx expo start
```

Lalu pilih: `a` (Android), `i` (iOS), `w` (web), atau scan QR dengan Expo Go.

*Then press: `a` (Android), `i` (iOS), `w` (web), or scan the QR with Expo Go.*

### 4. Script lain / Other scripts

```bash
npm run android   # expo start --android
npm run ios       # expo start --ios
npm run web       # expo start --web
npm run lint      # expo lint
```

---

## 📦 Build APK / App Bundle

**Indonesia:** project ini siap EAS Build. Profil ada di `eas.json` (`development`, `preview`, `production`).

**English:** *this project is EAS Build-ready. Profiles live in `eas.json` (`development`, `preview`, `production`).*

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # APK internal/tester
eas build -p android --profile production # AAB untuk Play Store / for Play Store
```

---

## 🖨️ Cetak Struk / Receipt Printing

**Indonesia:**

1. Di layar Kasir, tekan **Checkout** → pilih **Cetak Struk** (atau dari Riwayat → detail → **Export ke PDF**).
2. Aplikasi membuat file PDF dari template 58mm lalu membuka dialog share bawaan HP.
3. Kirim ke printer thermal (via aplikasi printer) atau simpan/kirim sebagai PDF.

**English:**

1. *On the Cashier screen, tap **Checkout** → **Cetak Struk** (or History → detail → **Export ke PDF**).*
2. *The app renders a PDF from the 58mm template and opens the native share sheet.*
3. *Send it to a thermal printer (via printer app) or save/share as PDF.*

> Nama toko, alamat, dan telepon masih hardcoded di kode (`WARUNG POS`, `Jl. Warung No. 1`). Ubah di satu tempat saat kamu sentuh kode: pemanggil `buildReceiptHtml`.
>
> *Store name, address, and phone are still hardcoded (`WARUNG POS`, `Jl. Warung No. 1`). Change them at the `buildReceiptHtml` call sites.*

---

## ⚠️ Keterbatasan & Roadmap / Limitations & Roadmap

**Indonesia:**

- Stok produk (`stok`) belum dipakai di UI kasir.
- Laporan omzet harian (`hitungPenjualanHariIni`) sudah ada di service tapi belum ada layarnya.
- Info toko masih hardcoded — idealnya pindah ke layar Pengaturan.
- Belum ada testing otomatis.
- File contoh Expo `app/(tabs)/explore.tsx` belum dihapus.

**English:**

- *Product stock (`stok`) is not used in the cashier UI yet.*
- *Daily revenue helper (`hitungPenjualanHariIni`) exists in the service but has no screen yet.*
- *Store info is hardcoded — ideally moved to a Settings screen.*
- *No automated tests yet.*
- *Unused Expo sample `app/(tabs)/explore.tsx` is still in the repo.*

---

## 🤝 Kontribusi / Contributing

**Indonesia:**

1. Fork repo ini.
2. Buat branch: `git checkout -b fitur/nama-fitur`.
3. Commit jelas berbahasa Indonesia atau Inggris.
4. Buka Pull Request ke `main`.

**English:**

1. *Fork this repo.*
2. *Create a branch: `git checkout -b feature/name`.*
3. *Write clear commits in Indonesian or English.*
4. *Open a Pull Request to `main`.*

---

## 📄 Lisensi / License

MIT — lihat file [LICENSE](./LICENSE).

*MIT — see the [LICENSE](./LICENSE) file.*
