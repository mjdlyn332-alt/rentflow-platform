# عقد تكامل Django المنفذ

أصبح `backend/` خادم Django REST فعلياً، مع PostgreSQL/Neon في الإنتاج، JWT للتطبيق، عزل server-side حسب `organization`، ونماذج تشغيلية متعددة المنشآت. تطبيق الجوال يبقى متوافقاً مع العقد ويستطيع استخدام mock adapter محلياً عند غياب عنوان API.

## ما تم تنفيذه

- جلسة JWT قصيرة العمر عبر `POST /api/auth/login` و`POST /api/auth/refresh` و`GET /api/auth/me`.
- نماذج Organization وUser والأدوار SUPER_ADMIN وOWNER وSTAFF وCOLLECTOR وRENTER وUNIT_OWNER.
- العقارات والوحدات والأطراف والعقود والأقساط.
- الخدمات وقراءات العدادات وفواتير الخدمات.
- الصندوق والتحصيل والسندات؛ إنشاء السند ذري داخل transaction مع قفل الصندوق ومفتاح idempotency وتسجيل AuditEvent، ومنع تعديل/حذف السند المرحّل.
- الصيانة والإشعارات وشجرة الحسابات وقيود اليومية كأساس للمحاسبة.
- `GET /api/dashboard` يعيد مؤشرات المنشأة والبيانات التي يحق للدور رؤيتها.
- `GET /api/health` غير محمي لاستخدام Render health check.

## المسارات

| المجموعة | المسارات |
| --- | --- |
| الجلسة | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me` |
| الملخص | `GET /api/dashboard` |
| العقارات | `/api/properties`, `/api/units`, `/api/parties` |
| العقود | `/api/agreements`, `/api/installments` |
| الخدمات | `/api/services`, `/api/readings`, `/api/service-bills` |
| التحصيل | `/api/cashboxes`, `POST /api/vouchers` |
| التشغيل | `/api/maintenance`, `/api/notifications` |

كل endpoint تشغيلي يشتق المنشأة من المستخدم المصادق عليه ولا يقبل `organization_id` من العميل. المبالغ Decimal والتواريخ ISO-8601. ترحيل القيود والفترات المقفلة والتسويات المتقدمة موضوعة في نموذج المحاسبة وتحتاج استكمال قواعد الأعمال قبل تشغيلها إنتاجياً.

## التشغيل والنشر

محلياً: `backend/.venv/bin/python backend/manage.py test core` مع `DATABASE_URL` غير مضبوط يستخدم SQLite للاختبارات. إنتاجياً: `DATABASE_URL` هو اتصال Neon الخاص، وRender يشغّل migrations ثم Gunicorn عبر `backend/Dockerfile` و`render.yaml`.
