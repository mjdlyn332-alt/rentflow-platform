import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth/auth-context";
import { rentflowApi, type DashboardSnapshot, type StatusTone } from "@/lib/domain/rentflow";

const toneColor: Record<StatusTone, string> = { success: "#0F766E", warning: "#B45309", danger: "#B42318", neutral: "#64748B" };
type PortalRole = "RENTER" | "COLLECTOR" | "OWNER" | "STAFF" | "SUPER_ADMIN" | "UNIT_OWNER";

const roleCopy: Record<PortalRole, { eyebrow: string; title: string; subtitle: string }> = {
  RENTER: { eyebrow: "بوابة المستأجر", title: "كل التزاماتك في مكان واحد", subtitle: "تابع عقدك وفواتيرك ومدفوعاتك من مصدر Django." },
  COLLECTOR: { eyebrow: "بوابة المحصل", title: "أنجز جولة التحصيل بثقة", subtitle: "مهام اليوم والصندوق والسندات بصلاحيات الخادم." },
  OWNER: { eyebrow: "لوحة المالك", title: "صورة أدق عن عقاراتك", subtitle: "راقب الإشغال والتحصيل والعمليات التي تحتاج قراراً." },
  STAFF: { eyebrow: "بوابة الموظف", title: "شغّل العمليات اليومية بوضوح", subtitle: "تابع العقارات والخدمات والصيانة من منشأتك." },
  SUPER_ADMIN: { eyebrow: "لوحة المشرف العام", title: "إدارة المنشأة من مركز واحد", subtitle: "راقب الوحدات والعقود والتحصيل مع صلاحيات Django الكاملة." },
  UNIT_OWNER: { eyebrow: "بوابة مالك الوحدة", title: "تابع وحداتك وعوائدها", subtitle: "اطّلع على الإشغال والعقود والبيانات المرتبطة بوحداتك." },
};

function resolveRole(role: string | undefined): PortalRole {
  return ["RENTER", "COLLECTOR", "OWNER", "STAFF", "SUPER_ADMIN", "UNIT_OWNER"].includes(role ?? "") ? role as PortalRole : "RENTER";
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <View style={[styles.pill, { backgroundColor: `${toneColor[tone]}16` }]}><View style={[styles.pillDot, { backgroundColor: toneColor[tone] }]} /><Text style={[styles.pillText, { color: toneColor[tone] }]}>{label}</Text></View>;
}

function SectionHeading({ title, actionLabel, onPress }: { title: string; actionLabel: string; onPress: () => void }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.sectionAction}>{actionLabel}</Text></Pressable></View>;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const role = resolveRole(user?.role);
  const copy = roleCopy[role];

  const loadDashboard = () => rentflowApi.getDashboard().then((data) => { setDashboard(data); setError(null); }).catch(() => setError("تعذر تحميل بيانات المنشأة من Django."));
  useEffect(() => { loadDashboard(); }, []);

  const metrics = useMemo(() => {
    if (role === "RENTER") return [{ value: dashboard?.metrics.rent_due ?? "—", label: "المستحق", icon: "event-note" as const }, { value: String(dashboard?.agreements.length ?? 0), label: "العقود", icon: "description" as const }, { value: String(dashboard?.notifications.length ?? 0), label: "الإشعارات", icon: "receipt-long" as const }];
    if (role === "COLLECTOR") return [{ value: dashboard?.metrics.rent_due ?? "—", label: "مستحق للتحصيل", icon: "payments" as const }, { value: String(dashboard?.metrics.properties ?? 0), label: "العقارات المسندة", icon: "task-alt" as const }, { value: String(dashboard?.metrics.units ?? 0), label: "الوحدات", icon: "account-balance-wallet" as const }];
    if (role === "UNIT_OWNER") return [{ value: String(dashboard?.metrics.units ?? 0), label: "وحداتي", icon: "home-work" as const }, { value: `${dashboard?.metrics.units ? Math.round((dashboard.metrics.occupied / dashboard.metrics.units) * 100) : 0}%`, label: "الإشغال", icon: "pie-chart" as const }, { value: String(dashboard?.agreements.length ?? 0), label: "العقود", icon: "description" as const }];
    if (role === "SUPER_ADMIN") return [{ value: String(dashboard?.metrics.properties ?? 0), label: "العقارات", icon: "apartment" as const }, { value: String(dashboard?.metrics.units ?? 0), label: "الوحدات", icon: "domain" as const }, { value: String(dashboard?.notifications.length ?? 0), label: "التنبيهات", icon: "notifications-none" as const }];
    return [{ value: String(dashboard?.metrics.units ?? 0), label: "إجمالي الوحدات", icon: "apartment" as const }, { value: `${dashboard?.metrics.units ? Math.round((dashboard.metrics.occupied / dashboard.metrics.units) * 100) : 0}%`, label: "الإشغال", icon: "pie-chart" as const }, { value: String(dashboard?.metrics.properties ?? 0), label: "العقارات", icon: "trending-up" as const }];
  }, [dashboard, role]);

  const action = (message: string) => setNotice(message);
  const agreement = dashboard?.agreements[0];

  return <ScreenContainer containerClassName="bg-[#F7F8F6]" safeAreaClassName="bg-[#F7F8F6]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.brandRow}><View style={styles.logo}><MaterialIcons name="key" size={19} color="#FFFFFF" /></View><Text style={styles.brand}>RentFlow</Text></View><Pressable accessibilityLabel="الإشعارات" onPress={() => action("الإشعارات محمّلة من Django")} style={styles.bell}><MaterialIcons name="notifications-none" size={23} color="#0F172A" /></Pressable></View>
    <View style={styles.welcome}><Text style={styles.eyebrow}>{copy.eyebrow} · {dashboard?.organization ?? user?.organization ?? "منشأتك"}</Text><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text>{error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}</View>
    <View style={styles.metricsRow}>{metrics.map((metric) => <View key={metric.label} style={styles.metric}><View style={styles.metricIcon}><MaterialIcons name={metric.icon} size={20} color="#0F766E" /></View><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>)}</View>
    {notice && <Pressable onPress={() => setNotice(null)} style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></Pressable>}
    {!dashboard ? <Text style={styles.loading}>جارٍ تحميل بياناتك من Django...</Text> : role === "RENTER" ? <>
      <SectionHeading title="العقد الحالي" actionLabel="تحديث" onPress={loadDashboard} />
      {agreement ? <View style={styles.contractCard}><Text style={styles.cardKicker}>{agreement.property}</Text><Text style={styles.contractUnit}>{agreement.unit}</Text><View style={styles.divider} /><Text style={styles.metaValue}>{agreement.period}</Text><Text style={styles.money}>{agreement.rent}</Text><StatusPill label={agreement.status} tone="success" /></View> : <Text style={styles.loading}>لا يوجد عقد نشط مرتبط بهذا الحساب.</Text>}
      <SectionHeading title="الأقساط القادمة" actionLabel="كل الأقساط" onPress={() => action("تم تحميل الأقساط من Django")} />
      {(agreement?.installments ?? []).map((item) => <View key={item.id} style={styles.listCard}><View style={styles.listIcon}><MaterialIcons name="calendar-today" size={19} color={toneColor[item.tone]} /></View><View style={styles.listMain}><Text style={styles.listTitle}>{item.label}</Text><Text style={styles.listSub}>{item.dueDate}</Text></View><View style={styles.listSide}><Text style={styles.listAmount}>{item.amount}</Text><StatusPill label={item.status} tone={item.tone} /></View></View>)}
    </> : role === "COLLECTOR" ? <>
      <SectionHeading title="مهام اليوم" actionLabel="تحديث" onPress={loadDashboard} /><View style={styles.actionGrid}><Pressable onPress={() => action("التحصيل يتطلب POST إلى Django مع مفتاح idempotency")} style={styles.quickAction}><MaterialIcons name="payments" size={23} color="#0F766E" /><Text style={styles.quickLabel}>تحصيل جديد</Text></Pressable><Pressable onPress={() => action("القراءة تتطلب صلاحية المحصل من Django")} style={styles.quickAction}><MaterialIcons name="speed" size={23} color="#0F766E" /><Text style={styles.quickLabel}>تسجيل قراءة</Text></Pressable></View>
    </> : role === "SUPER_ADMIN" ? <>
      <SectionHeading title="مركز الإدارة" actionLabel="تحديث" onPress={loadDashboard} /><View style={styles.actionGrid}><Pressable onPress={() => action("إدارة المستخدمين والمنشآت مرتبطة بصلاحيات Django")} style={styles.quickAction}><MaterialIcons name="manage-accounts" size={23} color="#0F766E" /><Text style={styles.quickLabel}>المستخدمون والصلاحيات</Text></Pressable><Pressable onPress={() => action("التقارير تعتمد على بيانات المنشأة من Django")} style={styles.quickAction}><MaterialIcons name="analytics" size={23} color="#0F766E" /><Text style={styles.quickLabel}>التقارير</Text></Pressable></View><PropertyList dashboard={dashboard} />
    </> : <>
      <SectionHeading title={role === "UNIT_OWNER" ? "وحداتك" : role === "STAFF" ? "العمليات اليومية" : "عقاراتك"} actionLabel="تحديث" onPress={loadDashboard} /><PropertyList dashboard={dashboard} />
    </>}
    <Text style={styles.footerText}>هوية المستخدم والصلاحيات والبيانات مصدرها Django API، ولا يعتمد التطبيق على دور يختاره المستخدم محلياً.</Text>
  </ScrollView></ScreenContainer>;
}

function PropertyList({ dashboard }: { dashboard: DashboardSnapshot }) {
  return <>{dashboard.properties.map((property) => <View key={property.id} style={styles.propertyCard}><Text style={styles.propertyName}>{property.name}</Text><Text style={styles.listSub}>{property.location}</Text><View style={styles.progressTrack}><View style={[styles.progress, { width: `${property.units ? Math.round(property.occupied / property.units * 100) : 0}%` }]} /></View><Text style={styles.metaLabel}>{property.occupied} مؤجرة من {property.units} وحدة</Text></View>)}{!dashboard.properties.length && <Text style={styles.loading}>لا توجد عقارات أو وحدات مرتبطة بهذه المنشأة بعد.</Text>}</>;
}

const styles = StyleSheet.create({ scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, writingDirection: "rtl" }, header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, brandRow: { flexDirection: "row-reverse", alignItems: "center", gap: 9 }, logo: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#0F766E", alignItems: "center", justifyContent: "center" }, brand: { fontSize: 21, fontWeight: "800", color: "#0F172A" }, bell: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" }, welcome: { marginTop: 28, alignItems: "flex-end" }, eyebrow: { fontSize: 12, color: "#0F766E", fontWeight: "700", marginBottom: 8 }, title: { textAlign: "right", fontSize: 28, lineHeight: 35, color: "#0F172A", fontWeight: "800" }, subtitle: { textAlign: "right", color: "#64748B", fontSize: 14, lineHeight: 22, marginTop: 7 }, error: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 8, marginTop: 10 }, errorText: { color: "#B42318", fontSize: 11 }, metricsRow: { flexDirection: "row-reverse", gap: 9, marginVertical: 20 }, metric: { flex: 1, minHeight: 112, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 13, alignItems: "flex-end", borderWidth: 1, borderColor: "#EDF0F2" }, metricIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#E7F5F1", alignItems: "center", justifyContent: "center", marginBottom: 9 }, metricValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" }, metricLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", textAlign: "right", marginTop: 3 }, sectionHeading: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 7, marginBottom: 10 }, sectionTitle: { fontSize: 18, color: "#0F172A", fontWeight: "800" }, sectionAction: { fontSize: 12, color: "#0F766E", fontWeight: "700" }, contractCard: { backgroundColor: "#0F766E", borderRadius: 22, padding: 18, marginBottom: 19, alignItems: "flex-end" }, cardKicker: { color: "#B8E4DB", fontSize: 12, fontWeight: "700" }, contractUnit: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 5 }, divider: { height: 1, backgroundColor: "#FFFFFF30", marginVertical: 15, width: "100%" }, metaValue: { color: "#FFFFFF", fontSize: 12 }, money: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginTop: 7 }, pill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginTop: 12 }, pillDot: { width: 6, height: 6, borderRadius: 3 }, pillText: { fontSize: 10, fontWeight: "800" }, listCard: { backgroundColor: "#FFFFFF", borderRadius: 17, padding: 13, marginBottom: 9, flexDirection: "row-reverse", alignItems: "center", borderWidth: 1, borderColor: "#EDF0F2" }, listIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginLeft: 10 }, listMain: { flex: 1, alignItems: "flex-end" }, listTitle: { fontSize: 13, color: "#0F172A", fontWeight: "800" }, listSub: { color: "#64748B", fontSize: 11, marginTop: 4 }, listSide: { alignItems: "flex-start", gap: 6 }, listAmount: { color: "#0F172A", fontSize: 13, fontWeight: "800" }, actionGrid: { flexDirection: "row-reverse", gap: 10 }, quickAction: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, alignItems: "flex-end", gap: 10 }, quickLabel: { color: "#0F172A", fontSize: 13, fontWeight: "800", textAlign: "right" }, propertyCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#EDF0F2", alignItems: "flex-end" }, propertyName: { color: "#0F172A", fontSize: 15, fontWeight: "800" }, progressTrack: { width: "100%", height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, marginTop: 15, overflow: "hidden" }, progress: { height: 8, backgroundColor: "#0F766E", borderRadius: 4 }, metaLabel: { color: "#64748B", fontSize: 11, marginTop: 8 }, notice: { backgroundColor: "#E7F5F1", borderRadius: 14, padding: 12, marginBottom: 12 }, noticeText: { color: "#0F766E", fontSize: 12, textAlign: "right" }, loading: { color: "#64748B", fontSize: 13, textAlign: "right", paddingVertical: 26 }, footerText: { color: "#64748B", fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 24 } });
