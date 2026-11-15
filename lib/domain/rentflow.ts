import { djangoApi, type DashboardResponse, type DjangoUser } from "@/lib/api/client";

export type UserRole = DjangoUser["role"];
export type StatusTone = "success" | "warning" | "danger" | "neutral";
export type Tenure = "RENTAL" | "OWNED";

export type Installment = { id: string; label: string; dueDate: string; amount: string; status: string; tone: StatusTone };
export type RentAgreement = { id: string; property: string; unit: string; period: string; status: string; tenant: string; rent: string; deposit: string; installments: Installment[] };
export type PropertySummary = { id: string; name: string; location: string; units: number; occupied: number; collection: string; tone: StatusTone };
export type NotificationItem = { id: string; title: string; body: string; time: string; tone: StatusTone };
export type DashboardSnapshot = { organization: string; role: UserRole; currency: string; agreements: RentAgreement[]; properties: PropertySummary[]; notifications: NotificationItem[]; metrics: DashboardResponse["metrics"] };

function toneForStatus(status: string): StatusTone {
  if (["PAID", "ACTIVE", "POSTED"].includes(status)) return "success";
  if (["PARTIAL", "DUE", "SCHEDULED", "ISSUED"].includes(status)) return "warning";
  if (["VOID", "OVERDUE", "CANCELLED"].includes(status)) return "danger";
  return "neutral";
}

export function mapDashboard(data: DashboardResponse): DashboardSnapshot {
  return {
    organization: data.organization.name,
    role: data.role,
    currency: data.currency,
    metrics: data.metrics,
    agreements: data.agreements.map((item) => {
      const agreement = item as { id: string; property_name?: string; unit_number?: string; start_date?: string; end_date?: string; status?: string; tenant_name?: string; annual_rent?: string; deposit?: string; installments?: Array<{ id: string; sequence: number; due_date: string; amount: string; status: string }> };
      return {
        id: agreement.id,
        property: agreement.property_name ?? "—",
        unit: agreement.unit_number ?? "—",
        period: `${agreement.start_date ?? "—"} — ${agreement.end_date ?? "—"}`,
        status: agreement.status ?? "—",
        tenant: agreement.tenant_name ?? "—",
        rent: `${agreement.annual_rent ?? "0"} ${data.currency}`,
        deposit: `${agreement.deposit ?? "0"} ${data.currency}`,
        installments: (agreement.installments ?? []).map((installment) => ({
          id: installment.id,
          label: `القسط ${installment.sequence}`,
          dueDate: installment.due_date,
          amount: `${installment.amount} ${data.currency}`,
          status: installment.status,
          tone: toneForStatus(installment.status),
        })),
      };
    }),
    properties: data.properties.map((property) => ({
      id: property.id,
      name: property.name,
      location: [property.address, property.city].filter(Boolean).join("، ") || "—",
      units: property.units_count,
      occupied: property.occupied_count,
      collection: "—",
      tone: property.occupied_count > 0 ? "success" : "neutral",
    })),
    notifications: data.notifications.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      time: new Date(item.created_at).toLocaleString("ar-SA"),
      tone: item.read_at ? "neutral" : "warning",
    })),
  };
}

export const rentflowApi = {
  async getDashboard() {
    return mapDashboard(await djangoApi.dashboard());
  },
};
