# 🌐 Multi-Language Implementation Guide

Panduan implementasi multi-language (English & Indonesia) untuk aplikasi Travel Management System.

## ✅ Status Implementasi

### Sudah Diimplementasikan:
- ✅ Setup i18n configuration
- ✅ Language translation files (English & Indonesia)
- ✅ Language Switcher component (ID/EN button)
- ✅ **Dashboard** - Sidebar menu & welcome message
- ✅ **Manajemen User** - Title, subtitle, statistics, add button

### Perlu Dilengkapi (Optional):
- ⏳ **Manajemen User** - Table headers, form labels, filters
- ⏳ **Halaman lainnya** - Master Kota, Master Rute, Booking, dll

---

## 📦 Dependencies

Installed packages:
```json
{
  "i18next": "^latest",
  "react-i18next": "^latest",
  "i18next-browser-languagedetector": "^latest"
}
```

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

### 2. File Structure

```
frontend/src/
├── i18n/
│   ├── config.js           # i18n configuration
│   └── locales/
│       ├── en.json         # English translations
│       └── id.json         # Indonesia translations
├── components/
│   └── LanguageSwitcher.jsx  # Language toggle button
└── main.jsx                # Import i18n config
```

---

## 🎯 Cara Menggunakan

### 1. Dalam Component

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.add')}</button>
    </div>
  );
}
```

### 2. Menambah Translation Key Baru

**File: `frontend/src/i18n/locales/en.json`**
```json
{
  "myPage": {
    "title": "My Page Title",
    "subtitle": "My subtitle text"
  }
}
```

**File: `frontend/src/i18n/locales/id.json`**
```json
{
  "myPage": {
    "title": "Judul Halaman Saya",
    "subtitle": "Teks subjudul saya"
  }
}
```

### 3. Menggunakan di Component

```jsx
function MyPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <h1>{t('myPage.title')}</h1>
      <p>{t('myPage.subtitle')}</p>
    </>
  );
}
```

---

## 📖 Translation Keys Reference

### Common (Umum)
```javascript
t('common.welcome')      // "Welcome" / "Selamat Datang"
t('common.logout')       // "Logout" / "Keluar"
t('common.search')       // "Search" / "Cari"
t('common.add')          // "Add" / "Tambah"
t('common.edit')         // "Edit" / "Edit"
t('common.delete')       // "Delete" / "Hapus"
t('common.save')         // "Save" / "Simpan"
t('common.cancel')       // "Cancel" / "Batal"
t('common.loading')      // "Loading..." / "Memuat..."
```

### Sidebar
```javascript
t('sidebar.dashboard')         // "Dashboard"
t('sidebar.masterData')        // "Master Data"
t('sidebar.masterCity')        // "Master City" / "Master Kota"
t('sidebar.masterRoute')       // "Master Route" / "Master Rute"
t('sidebar.masterVehicle')     // "Master Vehicle" / "Master Armada"
t('sidebar.masterDriver')      // "Master Driver"
t('sidebar.travelSchedule')    // "Travel Schedule" / "Jadwal Perjalanan"
t('sidebar.bookingTicket')     // "Booking & Ticket" / "Booking & Tiket"
t('sidebar.payment')           // "Payment" / "Pembayaran"
t('sidebar.checkIn')           // "Check-in Passengers" / "Check-in Penumpang"
t('sidebar.userManagement')    // "User Management" / "Manajemen User"
t('sidebar.reports')           // "Reports" / "Laporan"
```

### Dashboard
```javascript
t('dashboard.title')           // "Dashboard"
t('dashboard.subtitle')        // "Overview..." / "Ringkasan..."
t('dashboard.statistics.totalUsers')
t('dashboard.statistics.totalBookings')
t('dashboard.statistics.totalRevenue')
t('dashboard.statistics.activeSchedules')
```

### User Management
```javascript
t('userManagement.title')              // "User Management" / "Manajemen User"
t('userManagement.subtitle')           // "Manage system users..."
t('userManagement.addUser')            // "Add New User" / "Tambah User Baru"
t('userManagement.editUser')           // "Edit User"
t('userManagement.deleteUser')         // "Delete User" / "Hapus User"

// Statistics
t('userManagement.statistics.totalUsers')   // "Total Users" / "Total User"
t('userManagement.statistics.admin')        // "Admin"
t('userManagement.statistics.operator')     // "Operator"
t('userManagement.statistics.driver')       // "Driver"
t('userManagement.statistics.customer')     // "Customer"

// Table
t('userManagement.table.name')         // "Name" / "Nama"
t('userManagement.table.email')        // "Email"
t('userManagement.table.phone')        // "Phone" / "Telepon"
t('userManagement.table.role')         // "Role"
t('userManagement.table.createdAt')    // "Created At" / "Dibuat Pada"
t('userManagement.table.actions')      // "Actions" / "Aksi"

// Form
t('userManagement.form.name')          // "Full Name" / "Nama Lengkap"
t('userManagement.form.email')         // "Email Address" / "Alamat Email"
t('userManagement.form.password')      // "Password"
t('userManagement.form.phone')         // "Phone Number" / "Nomor Telepon"
t('userManagement.form.role')          // "User Role" / "Role User"

// Messages
t('userManagement.messages.addSuccess')      // "User added successfully"
t('userManagement.messages.updateSuccess')   // "User updated successfully"
t('userManagement.messages.deleteSuccess')   // "User deleted successfully"
t('userManagement.messages.deleteConfirm')   // "Are you sure..."
```

---

## 🔧 Melengkapi Translation untuk Halaman Lain

### Template untuk Page Baru:

**1. Import useTranslation**
```jsx
import { useTranslation } from 'react-i18next';
```

**2. Gunakan di Component**
```jsx
function MasterKota() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('masterCity.title')}</h1>
      {/* ... */}
    </div>
  );
}
```

**3. Tambah Translation Keys**

Edit `en.json` dan `id.json`:
```json
{
  "masterCity": {
    "title": "City Management",
    "addCity": "Add City",
    "editCity": "Edit City",
    "cityName": "City Name",
    "province": "Province"
  }
}
```

---

## 🌍 Language Switcher

Language switcher sudah otomatis muncul di **header navbar** (pojok kanan atas).

### Features:
- ✅ Toggle ID/EN button
- ✅ Auto-save preference ke localStorage
- ✅ Auto-detect browser language
- ✅ Persist across sessions

### Mengubah Default Language

Edit `frontend/src/i18n/config.js`:
```javascript
i18n.init({
  // ...
  fallbackLng: 'id',  // Ubah ke 'en' untuk English default
  lng: localStorage.getItem('language') || 'id',
  // ...
});
```

---

## 📝 Best Practices

1. **Gunakan Nested Keys**
   ```json
   {
     "page": {
       "section": {
         "key": "value"
       }
     }
   }
   ```

2. **Konsisten Naming**
   - Gunakan camelCase untuk keys
   - Group per halaman/section
   - Gunakan common untuk term umum

3. **Hindari Hardcoded Text**
   ```jsx
   // ❌ Bad
   <button>Simpan</button>
   
   // ✅ Good
   <button>{t('common.save')}</button>
   ```

4. **Test Both Languages**
   - Switch language saat development
   - Pastikan layout tidak pecah dengan text panjang
   - Test dengan real data

---

## 🐛 Troubleshooting

### Translation tidak muncul / menampilkan key

**Solusi:**
1. Check apakah key exists di `en.json` dan `id.json`
2. Restart development server
3. Clear browser cache & localStorage
4. Pastikan `import './i18n/config'` ada di `main.jsx`

### Language tidak berubah

**Solusi:**
1. Check console untuk error
2. Clear localStorage: `localStorage.removeItem('language')`
3. Refresh browser

### Layout pecah setelah ditranslasi

**Solusi:**
- Gunakan `className` yang responsive
- Test dengan text panjang (bahasa Indonesia biasanya lebih panjang)
- Gunakan `truncate`, `overflow-hidden`, atau flexbox

---

## 📚 Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Best Practices](https://www.i18next.com/principles/fallback)

---

## 🎉 Hasil Implementasi

### Halaman yang Sudah Support Multi-Language:

1. **Dashboard**
   - ✅ Sidebar navigation
   - ✅ Welcome message
   - ✅ Logout button

2. **User Management**
   - ✅ Page title & subtitle
   - ✅ Statistics cards
   - ✅ "Add User" button

### Language Switcher:
- ✅ Tersedia di header (pojok kanan atas)
- ✅ Button ID/EN yang responsive
- ✅ Auto-save preference

---

**Happy translating! 🌍**
