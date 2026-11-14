export type UserRole = "RENTER" | "COLLECTOR" | "OWNER";
export type StatusTone = "success" | "warning" | "danger" | "neutral";
export type Tenure = "RENTAL" | "OWNED";

export type Organization = {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  isActive: boolean;
};

export type UnitSummary = {
  id: string;
  propertyId: string;
  number: string;
  tenure: Tenure;
  status: "VACANT" | "RENTED" | "MAINTENANCE";
};

export type ServiceBill = {
  id: string;
  serviceName: string;
  period: string;
  amount: string;
  payer: string;
  status: "ISSUED" | "PARTIAL" | "PAID" | "VOID";
};

export type CashboxSummary = {
  id: string;
  label: string;
  balance: string;
  isActive: boolean;
};

export type Installment = {
  id: string;
  label: string;
  dueDate: string;
  amount: string;
  status: string;
  tone: StatusTone;
};

export type RentAgreement = {
  id: string;
  property: string;
  unit: string;
  period: string;
  status: string;
  tenant: string;
  rent: string;
  deposit: string;
  installments: Installment[];
};

export type PropertySummary = {
  id: string;
  name: string;
  location: string;
  units: number;
  occupied: number;
  collection: string;
  tone: StatusTone;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: StatusTone;
};

export type DashboardSnapshot = {
  organization: string;
  role: UserRole;
  currency: string;
  agreements: RentAgreement[];
  properties: PropertySummary[];
  notifications: NotificationItem[];
};

export const snapshot: DashboardSnapshot = {
  organization: "مساكن النخبة",
  role: "RENTER",
  currency: "ر.س",
  agreements: [
    {
      id: "AGR-1042",
      property: "برج الندى",
      unit: "شقة 12 - الدور 3",
      period: "01 يناير 2026 — 31 ديسمبر 2026",
      status: "نشط",
      tenant: "سارة عبدالله",
      rent: "48,000 ر.س",
      deposit: "4,000 ر.س",
      installments: [
        { id: "INS-01", label: "قسط مارس", dueDate: "05 مارس 2026", amount: "4,000 ر.س", status: "مدفوع", tone: "success" },
        { id: "INS-02", label: "قسط أبريل", dueDate: "05 أبريل 2026", amount: "4,000 ر.س", status: "مستحق قريباً", tone: "warning" },
        { id: "INS-03", label: "قسط مايو", dueDate: "05 مايو 2026", amount: "4,000 ر.س", status: "مجدول", tone: "neutral" },
      ],
    },
  ],
  properties: [
    { id: "PROP-01", name: "برج الندى", location: "حي الملقا، الرياض", units: 24, occupied: 21, collection: "86%", tone: "success" },
    { id: "PROP-02", name: "فلل الياسمين", location: "الياسمين، الرياض", units: 8, occupied: 6, collection: "72%", tone: "warning" },
    { id: "PROP-03", name: "مجمع الواحة", location: "العارض، الرياض", units: 36, occupied: 31, collection: "91%", tone: "success" },
  ],
  notifications: [
    { id: "NTF-01", title: "فاتورة مياه جديدة", body: "فاتورة أبريل لشقة 12 جاهزة للمراجعة", time: "منذ 35 دقيقة", tone: "warning" },
    { id: "NTF-02", title: "تم تسجيل التحصيل", body: "تم تسجيل سند القبض RV-2084 بنجاح", time: "اليوم، 09:42", tone: "success" },
    { id: "NTF-03", title: "عقد قريب الانتهاء", body: "يتبقى 42 يوماً على عقد الوحدة 07", time: "أمس", tone: "neutral" },
  ],
};

/** Replace this adapter with Django REST/JSON without changing screen components. */
export const rentflowApi = {
  async getDashboard(): Promise<DashboardSnapshot> {
    return snapshot;
  },
  async recordMeterReading(propertyId: string, value: number) {
    return { propertyId, value, recordedAt: new Date().toISOString(), status: "RECORDED" as const };
  },
};
