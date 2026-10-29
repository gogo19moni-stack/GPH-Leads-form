# إعداد Firestore لتطبيق GPH

أصبح Firestore هو مصدر البيانات الرئيسي للتطبيق. بيانات العملاء تُرسل إلى الخادم، والخادم يحفظها في مجموعة `leads` داخل مشروع Firebase `gph-client-form`. لا تُحفظ بيانات العملاء في GitHub.

## 1. تفعيل Firestore

من Firebase Console افتح المشروع `gph-client-form` ثم:

1. اختر **Build → Firestore Database**.
2. اضغط **Create database**.
3. اختر المنطقة المناسبة لنشاطك.
4. يمكن إبقاء قواعد Firestore مقفلة؛ الخادم يستخدم حساب الخدمة ولا يعتمد على قواعد العميل المباشر.

## 2. تشغيل API

أسرار Firebase التالية محفوظة في إعدادات المشروع ولا يجب وضعها في الكود أو GitHub:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_ADMIN_EXPORT_TOKEN`

لتشغيل الخادم محلياً على Windows:

```powershell
pnpm install
pnpm dev:server
```

## 3. ربط تطبيق الهاتف بالخادم

يجب أن يكون الهاتف والحاسوب على الشبكة نفسها. اعرف عنوان IPv4 للحاسوب عبر `ipconfig`، ثم شغّل Metro مع عنوان API:

```powershell
$env:EXPO_PUBLIC_FIREBASE_API_URL="http://192.168.1.25:3000"
pnpm dev:metro
```

الخادم العام المنشور حالياً هو:

```text
https://gphclients-2kdeyisk.manus.space
```

في نسخة الهاتف يمكن استخدام هذا العنوان تلقائياً، أو ضبط `EXPO_PUBLIC_FIREBASE_API_URL` على نفس عنوان HTTPS. لا تستخدم عنواناً داخلياً مثل `localhost` في تطبيق الهاتف.

## 4. لوحة الإدارة وتصدير Excel

افتح:

```text
http://localhost:3000/local-admin.html
```

أدخل قيمة `FIREBASE_ADMIN_EXPORT_TOKEN` في خانة رمز الإدارة. بعد ذلك يمكنك:

- عرض عدد الاستمارات والبيانات الأساسية.
- تحديث البيانات من Firestore.
- الضغط على **تنزيل ملف Excel** لتنزيل جميع العملاء.

رمز الإدارة لا يُرسل مع استمارات الزوار، ولا يجب مشاركته معهم.

## 5. النسخ الاحتياطي والأمان

فعّل النسخ الاحتياطي من Firebase Console أو استخدم أدوات تصدير Firestore الدورية. لا تفتح API دون HTTPS في الاستخدام العام، ولا تضع حساب الخدمة أو المفتاح الخاص في تطبيق Expo. يكتب endpoint العام الاستمارات فقط، بينما القراءة والتصدير محميان برمز الإدارة.
