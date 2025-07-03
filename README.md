```markdown
# REST API Usulan Asmas

Aplikasi ini adalah REST API untuk mengelola data usulan asmas, termasuk fitur CRUD (Create, Read, Update, Delete) dengan soft delete, serta relasi ke SKPD, Status Usulan, dan Periode. API ini dibangun menggunakan **Node.js**, **Express**, dan **SQLite**.

## Fitur Utama
- **Manajemen Usulan**: Buat, baca, ubah, dan hapus (soft delete) data usulan.
- **Relasi Data**: Hubungkan usulan dengan SKPD, Status Usulan, dan Periode.
- **Filter dan Pencarian**: Filter usulan berdasarkan tahun, status, SKPD, dan kata kunci pencarian.
- **Manajemen Gambar**: Tambahkan dan kelola gambar terkait usulan.
- **Soft Delete**: Data yang dihapus tidak dihapus permanen, hanya ditandai sebagai dihapus.

## Prasyarat
Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (versi 14 atau lebih baru)
- [npm](https://www.npmjs.com/) (biasanya sudah termasuk dengan Node.js)
- [SQLite](https://www.sqlite.org/) (opsional, karena SQLite sudah disertakan dalam `sqlite3`)

## Instalasi
Ikuti langkah-langkah berikut untuk menginstal dan menjalankan aplikasi:

1. **Clone Repository** (jika menggunakan Git):
   ```bash
   git clone <URL_REPOSITORY_ANDA>
   cd <NAMA_FOLDER>
   ```

2. **Instal Dependensi**:
   Jalankan perintah berikut untuk menginstal semua dependensi yang diperlukan:
   ```bash
   npm install
   ```

3. **Siapkan Database**:
   - Aplikasi ini menggunakan SQLite, sehingga database akan dibuat secara otomatis saat aplikasi dijalankan pertama kali.
   - File database (`my_table.db`) akan dibuat di direktori root proyek.

4. **Jalankan Aplikasi**:
   Jalankan aplikasi dengan perintah berikut:
   ```bash
   node app.js
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

## Penggunaan API
API ini menyediakan berbagai endpoint untuk mengelola data usulan, SKPD, status usulan, periode, dan gambar. Berikut adalah daftar endpoint yang tersedia:

### **Base URL**
```
http://localhost:3000
```

### **Endpoint Usulan**
| Method | Endpoint                  | Deskripsi                              | Parameter/Filters                     |
|--------|---------------------------|----------------------------------------|---------------------------------------|
| GET    | `/api/usulan`            | Mendapatkan semua usulan (tidak termasuk yang dihapus) | -                                     |
| GET    | `/api/usulan-asmas`      | Mendapatkan usulan dengan filter       | `tahun`, `status_id`, `skpd_id`, `search` |
| GET    | `/api/usulan/:id`        | Mendapatkan detail usulan berdasarkan ID | -                                     |
| POST   | `/api/usulan`            | Membuat usulan baru                    | -                                     |
| POST   | `/api/usulan-asmas`      | Membuat usulan asmas dengan gambar     | -                                     |
| PUT    | `/api/usulan/:id`        | Mengubah usulan                        | -                                     |
| PUT    | `/api/usulan-asmas/:id`  | Mengubah usulan asmas dengan gambar    | -                                     |
| DELETE | `/api/usulan/:id`        | Soft delete usulan                     | -                                     |

### **Endpoint SKPD**
| Method | Endpoint         | Deskripsi                  |
|--------|------------------|----------------------------|
| GET    | `/api/skpd`     | Mendapatkan semua SKPD     |
| POST   | `/api/skpd`     | Membuat SKPD baru          |

### **Endpoint Status Usulan**
| Method | Endpoint             | Deskripsi                      |
|--------|----------------------|--------------------------------|
| GET    | `/api/status-usulan` | Mendapatkan semua status usulan |
| POST   | `/api/status-usulan` | Membuat status usulan baru     |

### **Endpoint Periode**
| Method | Endpoint         | Deskripsi                  |
|--------|------------------|----------------------------|
| GET    | `/api/periode`  | Mendapatkan semua periode  |
| POST   | `/api/periode`  | Membuat periode baru       |

### **Endpoint Gambar Usulan**
| Method | Endpoint                  | Deskripsi                          |
|--------|---------------------------|------------------------------------|
| GET    | `/api/usulan/:id/gambar` | Mendapatkan gambar usulan          |
| POST   | `/api/usulan/:id/gambar` | Menambahkan gambar ke usulan       |
| DELETE | `/api/gambar/:id`        | Menghapus gambar                   |

## Contoh Penggunaan API

### **1. Mendapatkan Semua Usulan**
**Request**:
```
GET http://localhost:3000/api/usulan
```

**Response**:
```json
[
  {
    "id": 1,
    "judul": "Pembangunan Jalan Raya",
    "deskripsi": "Pembangunan jalan raya sepanjang 2 km",
    "pengusul": "Ahmad Hidayat",
    "kode_wilayah": "3201",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "skpd_id": 1,
    "periode_id": 2,
    "status_id": 2,
    "created_at": "2023-10-01T10:00:00Z",
    "updated_at": "2023-10-01T10:00:00Z",
    "skpd_nama": "Dinas Pekerjaan Umum",
    "periode_tahun": 2024,
    "status_nama": "Disetujui"
  },
  ...
]
```

### **2. Filter Usulan Asmas**
**Request**:
```
GET http://localhost:3000/api/usulan-asmas?tahun=2024&status_id=1&search=jalan
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "judul": "Pembangunan Jalan Raya",
      "deskripsi": "Pembangunan jalan raya sepanjang 2 km",
      "pengusul": "Ahmad Hidayat",
      "kode_wilayah": "3201",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "skpd_id": 1,
      "periode_id": 2,
      "status_id": 1,
      "created_at": "2023-10-01T10:00:00Z",
      "updated_at": "2023-10-01T10:00:00Z",
      "skpd_nama": "Dinas Pekerjaan Umum",
      "skpd_alamat": "Jl. Merdeka No. 123",
      "periode_tahun": 2024,
      "status_nama": "Pending"
    },
    ...
  ],
  "total": 5,
  "filters": {
    "tahun": "2024",
    "status_id": "1",
    "skpd_id": null,
    "search": "jalan"
  }
}
```

### **3. Membuat Usulan Asmas Baru**
**Request**:
```
POST http://localhost:3000/api/usulan-asmas
Content-Type: application/json

{
  "judul": "Pembangunan Jalan Asmas",
  "deskripsi": "Pembangunan infrastruktur jalan untuk akses yang lebih baik",
  "pengusul": "Ahmad Asmas",
  "kode_wilayah": "3201",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "skpd_id": 1,
  "periode_id": 2,
  "status_id": 1,
  "gambar": [
    { "file_path": "/uploads/gambar1.jpg", "keterangan": "Kondisi awal" },
    { "file_path": "/uploads/gambar2.jpg", "keterangan": "Desain usulan" }
  ]
}
```

**Response**:
```json
{
  "message": "Usulan Asmas created successfully",
  "data": {
    "id": 3,
    "judul": "Pembangunan Jalan Asmas",
    "deskripsi": "Pembangunan infrastruktur jalan untuk akses yang lebih baik",
    "pengusul": "Ahmad Asmas",
    "kode_wilayah": "3201",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "skpd_id": 1,
    "periode_id": 2,
    "status_id": 1,
    "created_at": "2023-10-01T10:00:00Z",
    "updated_at": "2023-10-01T10:00:00Z",
    "skpd_nama": "Dinas Pekerjaan Umum",
    "skpd_alamat": "Jl. Merdeka No. 123",
    "periode_tahun": 2024,
    "status_nama": "Pending",
    "gambar": [
      { "id": 1, "usulan_id": 3, "file_path": "/uploads/gambar1.jpg", "keterangan": "Kondisi awal" },
      { "id": 2, "usulan_id": 3, "file_path": "/uploads/gambar2.jpg", "keterangan": "Desain usulan" }
    ]
  }
}
```

### **4. Mengubah Usulan Asmas**
**Request**:
```
PUT http://localhost:3000/api/usulan-asmas/1
Content-Type: application/json

{
  "judul": "Pembangunan Jalan Asmas (Revisi)",
  "deskripsi": "Pembangunan infrastruktur jalan dengan tambahan drainase",
  "pengusul": "Ahmad Asmas",
  "kode_wilayah": "3201",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "skpd_id": 1,
  "periode_id": 2,
  "status_id": 2,
  "gambar": [
    { "file_path": "/uploads/gambar3.jpg", "keterangan": "Desain revisi" }
  ],
  "replace_images": true
}
```

**Response**:
```json
{
  "message": "Usulan Asmas updated successfully",
  "data": {
    "id": 1,
    "judul": "Pembangunan Jalan Asmas (Revisi)",
    "deskripsi": "Pembangunan infrastruktur jalan dengan tambahan drainase",
    "pengusul": "Ahmad Asmas",
    "kode_wilayah": "3201",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "skpd_id": 1,
    "periode_id": 2,
    "status_id": 2,
    "created_at": "2023-10-01T10:00:00Z",
    "updated_at": "2023-10-01T10:05:00Z",
    "skpd_nama": "Dinas Pekerjaan Umum",
    "skpd_alamat": "Jl. Merdeka No. 123",
    "periode_tahun": 2024,
    "status_nama": "Disetujui",
    "gambar": [
      { "id": 3, "usulan_id": 1, "file_path": "/uploads/gambar3.jpg", "keterangan": "Desain revisi" }
    ]
  }
}
```

### **5. Soft Delete Usulan**
**Request**:
```
DELETE http://localhost:3000/api/usulan/1
```

**Response**:
```
Status: 204 No Content
```

Catatan: Data tidak dihapus permanen, hanya ditandai dengan `deleted_at`. Untuk memastikan data telah dihapus, coba akses `GET /api/usulan/1`, yang akan mengembalikan error 404.

## Catatan Tambahan
- **Soft Delete**: Data yang dihapus tidak benar-benar dihapus dari database, melainkan ditandai dengan kolom `deleted_at`. Untuk mengembalikan data, Anda perlu mengatur `deleted_at` menjadi `NULL` secara manual di database.
- **Error Handling**: API mengembalikan status kode HTTP yang sesuai (misalnya, 404 untuk data tidak ditemukan, 400 untuk input tidak valid, dll.).
- **Pengujian API**: Gunakan alat seperti [Postman](https://www.postman.com/) atau [cURL](https://curl.se/) untuk menguji endpoint API.

## Struktur Database
Aplikasi ini menggunakan SQLite dengan tabel berikut:
- `usulan`: Menyimpan data usulan (termasuk `deleted_at` untuk soft delete).
- `skpd`: Menyimpan data SKPD.
- `status_usulan`: Menyimpan data status usulan.
- `periode`: Menyimpan data periode (tahun).
- `gambar_usulan`: Menyimpan data gambar terkait usulan.

## Kontribusi
Jika Anda ingin berkontribusi pada proyek ini, silakan fork repository, buat perubahan, dan ajukan pull request.


## Kontak
Untuk pertanyaan atau dukungan, silakan hubungi [lubnaski16@gmail.com](mailto:lubnaski16@gmail.com).
```