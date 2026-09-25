# 🌱 Daily Mentor — Telegram Bot & API

Kiçik gündəlik addımlarla davamlı inkişafı dəstəkləyən Telegram mentor botu. İstifadəçi maraqlandığı sahəni və mesaj alma saatını seçir; bot isə hər gün uyğun bir praktik təklif göndərir.

Mesaj bəyənildikdə irəliləyiş **5%** artır. İstifadəçi başqa variant istədikdə isə həmin gün üçün növbəti təklif göstərilir.

## ✨ Nələr edir?

- Telegram-da rahat kateqoriya, subkateqoriya və saat seçimi
- Hər aktiv istifadəçi üçün gündəlik avtomatik mentor mesajı
- İstifadəçinin saat qurşağına uyğun göndəriş vaxtı
- `Bəyəndim` və `Digər` seçimləri ilə interaktiv cavablar
- Hər subkateqoriya üzrə 20 bəyənmə ilə 100% irəliləyiş
- Excel-dən kateqoriyalar, subkateqoriyalar və 1,250 mesajın importu
- Frontend və inteqrasiya üçün JSON REST API

## 🧭 İş prinsipi

```text
/start
  ↓
Kateqoriya seçimi → Subkateqoriya seçimi → Gündəlik saat seçimi
  ↓
Gündəlik mentor mesajı
  ├─ ❤️ Bəyəndim  → +5% irəliləyiş
  └─ 🔄 Digər     → alternativ mesaj
```

## 🛠️ Texnologiyalar

- Node.js və Express 5
- MongoDB və Mongoose
- Telegram Bot API (`node-telegram-bot-api`)
- `node-cron` ilə gündəlik planlaşdırma
- `read-excel-file` ilə Excel seed prosesi
- Native Node.js test runner

## 🚀 Sürətli başlanğıc

### 1. Asılılıqları quraşdırın

```bash
npm install
```

### 2. Mühit dəyişənlərini hazırlayın

Layihənin kökündə `.env` faylı yaradın:

```env
PORT=8080
MONGO_URL=mongodb+srv://<username>:<db_password>@<cluster>/<database>?retryWrites=true&w=majority
MONGO_PASS=sizin_mongodb_parolunuz
TELEGRAM_BOT_TOKEN=sizin_telegram_bot_tokeniniz
```

`MONGO_URL` daxilindəki `<db_password>` hissəsi avtomatik olaraq `MONGO_PASS` dəyəri ilə əvəz olunur.

> Telegram botu olmadan yalnız API-ni yoxlamaq üçün `TELEGRAM_BOT_TOKEN` dəyişənini boş saxlaya bilərsiniz. Server işləyəcək, lakin bot və planlaşdırıcı aktiv olmayacaq.

### 3. Mesaj kitabxanasını bazaya yükləyin

`src/data/data.xlsx` faylındakı məzmunu MongoDB-yə import edin:

```bash
npm run seed
```

Seed prosesi 25 subkateqoriya və ümumilikdə 1,250 mentor mesajını yoxlayıb yükləyir.

### 4. Tətbiqi başladın

İnkişaf rejimi:

```bash
npm run dev
```

Production rejimi:

```bash
npm start
```

Server standart olaraq `http://localhost:8080` ünvanında işə düşür.

## 🔌 API

Sağlamlıq yoxlaması:

```http
GET /health
```

Kateqoriyalar:

```http
GET /api/categories
```

Seçilmiş kateqoriyanın subkateqoriyaları:

```http
GET /api/subcategories?categoryId=<categoryId>
```

Subkateqoriyaya aid mentor mesajları:

```http
GET /api/mentor/messages?subcategoryId=<subcategoryId>
```

İstifadəçi seçimini yadda saxlamaq:

```http
POST /api/mentor/preferences
Content-Type: application/json

{
  "telegramId": "123456789",
  "chatId": "123456789",
  "firstName": "Aylin",
  "timezone": "Asia/Baku",
  "subcategoryId": "<subcategoryId>",
  "pushTime": "09:00"
}
```

Mesaja cavab vermək:

```http
POST /api/mentor/actions
Content-Type: application/json

{
  "telegramId": "123456789",
  "deliveryId": "<deliveryId>",
  "action": "LIKE"
}
```

`action` dəyəri `LIKE` və ya `OTHER` ola bilər.

İrəliləyişi yoxlamaq:

```http
GET /api/mentor/progress?telegramId=123456789&subcategoryId=<subcategoryId>
```

## 🤖 Telegram botdan istifadə

1. Telegram-da botunuza `/start` yazın.
2. İnkişaf etmək istədiyiniz kateqoriyanı seçin.
3. Subkateqoriyanı və mesaj alma saatını təyin edin.
4. Bot sizə ilk təklifi göndərəcək və sonrakı günlərdə seçdiyiniz saatda davam edəcək.

Mövcud seçim saatları: `08:00`, `09:00`, `10:00`, `18:00`, `20:00`, `21:00`.

## 🧪 Testlər

```bash
npm test
```

Testlər vaxt formatını, saat qurşağı hesablamalarını və əsas API validasiyasını yoxlayır.

## 📁 Layihə quruluşu

```text
├── src/
│   ├── config/        # Konfiqurasiya və MongoDB bağlantısı
│   ├── controllers/   # HTTP sorğularının idarəsi
│   ├── data/          # Excel mesaj kitabxanası
│   ├── models/        # Mongoose modelləri
│   ├── routes/        # Express endpoint-ləri
│   ├── services/      # Mentor, Telegram və scheduler məntiqi
│   └── seed.js        # Excel → MongoDB importu
├── test/              # Avtomatlaşdırılmış testlər
└── server.js           # Tətbiqin giriş nöqtəsi
```

## 🔒 Təhlükəsizlik qeydi

`.env` faylını Git-ə əlavə etməyin. Bot tokeni və MongoDB giriş məlumatları yalnız təhlükəsiz mühit dəyişənləri vasitəsilə saxlanmalıdır.

---

Hər gün bir kiçik addım. Böyük dəyişikliklər də elə belə başlayır. ✨
