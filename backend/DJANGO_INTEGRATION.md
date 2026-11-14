# Django integration contract

هذا المجلد يوثق نقطة التكامل الخلفية المطلوبة في وثيقة PRD/SRS. لا يحتوي حالياً على خادم Django أو أسرار تشغيل؛ تطبيق الجوال يعمل ببيانات mock إلى أن يُنشأ backend مستقل.

## حدود المسؤولية

يقدم Django REST API جلسة قصيرة العمر، ويقرأ `organization` من الجلسة لا من جسم الطلب. كل طلب يمر عبر فحص حالة المستخدم والمنشأة والدور و`tokenVersion`. تُطبّق صلاحيات STAFF كمصفوفة مجال × (قراءة، إنشاء، تعديل، حذف)، وتُطبّق أعلام المحصل `canCollectRent` و`canCollectServices` و`canCollectMaintenance` و`canCreateServices` على الخادم.

تُنفّذ قواعد المجال في services داخل modular monolith: العقارات والوحدات، الأطراف، العقود والأقساط، الخدمات والعدادات، التحصيل والصناديق، الصيانة، الإخلاء والتأمين، المحاسبة، الإشعارات والتقارير. كل عملية مالية متعددة الجداول داخل transaction واحدة وبـ idempotency key، وكل مستند مرحّل يُصحح بمستند عكسي لا بالتعديل أو الحذف.

## واجهات يستهلكها التطبيق

| المجموعة | أمثلة |
| --- | --- |
| الجلسة | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| الملخص | `GET /api/dashboard?role=RENTER` |
| العقود | `GET /api/agreements`, `GET /api/agreements/{id}` |
| الخدمات | `GET /api/service-bills`, `GET /api/meters`, `POST /api/readings` |
| التحصيل | `GET /api/cashboxes`, `POST /api/vouchers`, `POST /api/vouchers/{id}/reverse` |
| العقارات | `GET /api/properties`, `GET /api/properties/{id}/units` |
| الإشعارات | `GET /api/notifications`, `POST /api/notifications/{id}/read` |

## شكل الاستجابة المختصر

```json
{
  "data": [],
  "meta": { "organization": "org_123", "page": 1, "pageSize": 20 },
  "errors": []
}
```

المبالغ تُعاد كنص Decimal مع العملة، والتواريخ ISO-8601 مع المنطقة الزمنية للمنشأة. لا يثق التطبيق بالواجهة في الصلاحيات أو المبالغ أو الحالات؛ الحالة النهائية تأتي من Django.

## PostgreSQL/RLS

يضبط Django `SET LOCAL app.current_org` داخل كل transaction ويستخدم اتصال تطبيق محدود الصلاحية، مع اتصال منفصل لمالك النظام لا يرى الجداول التشغيلية. تُفهرس القوائم ابتداءً من `organization_id` وتُضاف اختبارات عزل، توازن القيود، ورصيد التأمين إلى CI قبل نشر نسخة إنتاجية.
