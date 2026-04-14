<<<<<<< HEAD
# Foodna Shop - Restaurant Management System

نظام متكامل لإدارة مطعم يوفر واجهات للعملاء والموظفين والإدارة.

## المميزات

### للعملاء
- ✅ تصفح المنتجات والبحث
- ✅ إضافة المنتجات إلى السلة
- ✅ إنشاء الطلبات وتتبعها
- ✅ تقييم المنتجات والمراجعات
- ✅ استخدام الكوبونات والخصومات

### للإدارة
- ✅ إدارة المنتجات والتصنيفات
- ✅ إدارة الطلبات
- ✅ إدارة الكوبونات
- ✅ التقارير والإحصائيات

## التقنيات المستخدمة

- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Template Engine:** EJS
- **Security:** Helmet, Rate Limiting, Input Validation
- **File Upload:** Multer

## المتطلبات

- Node.js (v14 أو أحدث)
- MySQL (v5.7 أو أحدث)
- npm أو yarn

## التثبيت

1. استنساخ المشروع:
```bash
git clone <repository-url>
cd Foodna_Shob
```

2. تثبيت الحزم:
```bash
npm install
```

3. إعداد قاعدة البيانات:
- قم بإنشاء قاعدة بيانات MySQL
- قم بتنفيذ ملف `database_schema.sql` لإنشاء الجداول المطلوبة

4. إعداد متغيرات البيئة:
- أنشئ ملف `.env` في المجلد الرئيسي
- استخدم `.env.example` كمرجع

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=Foodna_Online
PORT=3000
SESSION_SECRET=your-secret-key
NODE_ENV=development
```

5. تشغيل التطبيق:
```bash
# Development
npm run dev

# Production
npm start
```

## البنية المعمارية

```
Foodna_Shob/
├── config/           # إعدادات قاعدة البيانات
├── core/             # المكونات الأساسية
│   ├── middlewares/  # Middleware للأمان والمصادقة
│   └── utils/        # أدوات مساعدة (Logger, Response)
├── modules/          # الوحدات المختلفة
│   ├── admin/        # واجهة الإدارة
│   ├── customer/     # واجهة العملاء
│   ├── cashier/      # واجهة الكاشير
│   └── chef/         # واجهة الشيف
├── routes/           # مسارات التطبيق
├── views/            # قوالب EJS
├── public/           # الملفات الثابتة
└── server.js         # نقطة الدخول
```

## الأمان

- ✅ استخدام Connection Pool
- ✅ Helmet للأمان
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Secure Session Management
- ✅ Password Hashing (bcrypt)

## API Endpoints

### العملاء
- `POST /api/cart/add` - إضافة منتج إلى السلة
- `GET /api/cart` - الحصول على السلة
- `POST /api/orders` - إنشاء طلب
- `GET /api/orders` - الحصول على الطلبات
- `POST /api/reviews` - إضافة تقييم

### الإدارة
- `GET /admin/api/categories` - الحصول على التصنيفات
- `POST /admin/api/categories` - إنشاء تصنيف
- `GET /admin/api/coupons` - الحصول على الكوبونات
- `POST /admin/api/coupons` - إنشاء كوبون

## التحسينات المطبقة

✅ تحويل من Callbacks إلى Async/Await
✅ نظام الطلبات الكامل
✅ نظام التقييمات والمراجعات
✅ نظام التصنيفات
✅ نظام الكوبونات والخصومات
✅ Logging System
✅ Error Handling محسّن
✅ Response Wrapper موحد
✅ Input Validation
✅ Security Middleware

## التطوير المستقبلي

- [ ] نظام الدفع الإلكتروني
- [ ] نظام الإشعارات
- [ ] Dashboard Analytics
- [ ] نظام التوصيل
- [ ] Unit Tests
- [ ] Integration Tests

## المساهمة

نرحب بالمساهمات! يرجى فتح Issue أو Pull Request.

## الرخصة

ISC



=======
# Foodna_Net
>>>>>>> cfe4b419c13fbe7c4dbc0d703add959a2e78e5fb
