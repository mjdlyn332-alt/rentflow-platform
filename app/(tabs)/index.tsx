import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { snapshot, type StatusTone, type UserRole } from "@/lib/domain/rentflow";

const roles: Array<{ key: UserRole; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { key: "RENTER", label: "المستأجر", icon: "person-outline" },
  { key: "COLLECTOR", label: "المحصل", icon: "account-balance-wallet" },
  { key: "OWNER", label: "المالك", icon: "business" },
];

const toneColor: Record<StatusTone, string> = {
  success: "#0F766E",
  warning: "#B45309",
  danger: "#B42318",
  neutral: "#64748B",
};

const roleCopy: Record<UserRole, { eyebrow: string; title: string; subtitle: string }> = {
  RENTER: { eyebrow: "بوابة المستأجر", title: "كل التزاماتك في مكان واحد", subtitle: "تابع عقدك وفواتيرك ومدفوعاتك بدون مفاجآت." },
  COLLECTOR: { eyebrow: "بوابة المحصل", title: "أنجز جولة التحصيل بثقة", subtitle: "مهام اليوم، القراءات، الصندوق والسندات في مسار واحد." },
  OWNER: { eyebrow: "لوحة المالك", title: "صورة أدق عن عقاراتك", subtitle: "راقب الإشغال والتحصيل والعمليات التي تحتاج قراراً." },
};

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <View style={[styles.pill, { backgroundColor: `${toneColor[tone]}16` }]}><View style={[styles.pillDot, { backgroundColor: toneColor[tone] }]} /><Text style={[styles.pillText, { color: toneColor[tone] }]}>{label}</Text></View>;
}

function Metric({ value, label, icon, accent = "#0F766E" }: { value: string; label: string; icon: keyof typeof MaterialIcons.glyphMap; accent?: string }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${accent}14` }]}><MaterialIcons name={icon} size={20} color={accent} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

export default function HomeScreen() {
  const [role, setRole] = useState<UserRole>("RENTER");
  const [notice, setNotice] = useState<string | null>(null);
  const copy = roleCopy[role];
  const agreement = snapshot.agreements[0];
  const metrics = useMemo(() => role === "RENTER" ? [{ value: "4,000", label: "المستحق القادم", icon: "event-note" as const }, { value: "12,000", label: "المدفوع هذا العام", icon: "check-circle" as const }, { value: "2", label: "فواتير مفتوحة", icon: "receipt-long" as const }] : role === "COLLECTOR" ? [{ value: "18,450", label: "تحصيل اليوم", icon: "payments" as const }, { value: "12", label: "مهمة اليوم", icon: "task-alt" as const }, { value: "6,200", label: "رصيد الصندوق", icon: "account-balance-wallet" as const }] : [{ value: "68", label: "إجمالي الوحدات", icon: "apartment" as const }, { value: "85%", label: "الإشغال", icon: "pie-chart" as const }, { value: "86%", label: "نسبة التحصيل", icon: "trending-up" as const }], [role]);

  const action = (message: string) => setNotice(message);

  return (
    <ScreenContainer containerClassName="bg-[#F7F8F6]" safeAreaClassName="bg-[#F7F8F6]">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}><View style={styles.logo}><MaterialIcons name="key" size={19} color="#FFFFFF" /></View><Text style={styles.brand}>RentFlow</Text></View>
          <Pressable accessibilityLabel="الإشعارات" onPress={() => action("لا توجد إشعارات جديدة غير المقروءة")} style={styles.bell}><MaterialIcons name="notifications-none" size={23} color="#0F172A" /><View style={styles.badge}><Text style={styles.badgeText}>2</Text></View></Pressable>
        </View>

        <View style={styles.welcome}><Text style={styles.eyebrow}>{copy.eyebrow}  ·  {snapshot.organization}</Text><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text><View style={styles.mockTag}><View style={styles.mockDot} /><Text style={styles.mockText}>عرض تجريبي — بيانات mock قابلة للاستبدال بـ Django API</Text></View></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow} directionalLockEnabled>
          {roles.map((item) => <Pressable key={item.key} onPress={() => setRole(item.key)} style={[styles.roleChip, role === item.key && styles.roleChipActive]}><MaterialIcons name={item.icon} size={17} color={role === item.key ? "#FFFFFF" : "#64748B"} /><Text style={[styles.roleText, role === item.key && styles.roleTextActive]}>{item.label}</Text></Pressable>)}
        </ScrollView>

        <View style={styles.metricsRow}>{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</View>

        {notice && <Pressable onPress={() => setNotice(null)} style={styles.notice}><MaterialIcons name="info-outline" size={18} color="#0F766E" /><Text style={styles.noticeText}>{notice}</Text><MaterialIcons name="close" size={17} color="#64748B" /></Pressable>}

        {role === "RENTER" ? <>
          <SectionHeading title="العقد الحالي" actionLabel="عرض التفاصيل" onPress={() => action("تفاصيل العقد متاحة عند ربط Django API")} />
          <View style={styles.contractCard}><View style={styles.contractTop}><View><Text style={styles.cardKicker}>{agreement.property}</Text><Text style={styles.contractUnit}>{agreement.unit}</Text></View><StatusPill label={agreement.status} tone="success" /></View><View style={styles.divider} /><View style={styles.contractMeta}><View><Text style={styles.metaLabel}>مدة العقد</Text><Text style={styles.metaValue}>{agreement.period}</Text></View><View style={styles.metaRight}><Text style={styles.metaLabel}>الإيجار السنوي</Text><Text style={styles.money}>{agreement.rent}</Text></View></View></View>
          <SectionHeading title="الأقساط القادمة" actionLabel="كل الأقساط" onPress={() => action("تم تحميل سجل الأقساط الكامل")} />
          {agreement.installments.map((item) => <View key={item.id} style={styles.listCard}><View style={styles.listIcon}><MaterialIcons name={item.tone === "success" ? "check" : "calendar-today"} size={19} color={toneColor[item.tone]} /></View><View style={styles.listMain}><Text style={styles.listTitle}>{item.label}</Text><Text style={styles.listSub}>{item.dueDate}</Text></View><View style={styles.listSide}><Text style={styles.listAmount}>{item.amount}</Text><StatusPill label={item.status} tone={item.tone} /></View></View>)}
        </> : role === "COLLECTOR" ? <>
          <SectionHeading title="مهام اليوم" actionLabel="عرض الكل" onPress={() => action("تم فتح قائمة المهام المسندة")}/>
          <View style={styles.actionGrid}><QuickAction icon="speed" label="تسجيل قراءة" onPress={() => action("نموذج القراءة جاهز")}/><QuickAction icon="payments" label="تحصيل جديد" onPress={() => action("نموذج سند القبض جاهز")}/><QuickAction icon="receipt-long" label="سندات اليوم" onPress={() => action("عرض سندات اليوم")}/><QuickAction icon="account-balance-wallet" label="الصندوق" onPress={() => action("رصيد الصندوق محفوظ بعد كل حركة")}/></View>
          <SectionHeading title="آخر العمليات" actionLabel="كل العمليات" onPress={() => action("تم فتح سجل العمليات")}/>{snapshot.notifications.slice(0, 2).map((item) => <Activity key={item.id} item={item} />)}
        </> : <>
          <SectionHeading title="عقاراتك" actionLabel="إدارة العقارات" onPress={() => action("إدارة العقارات متاحة في تبويب العقارات")}/>{snapshot.properties.map((property) => <View key={property.id} style={styles.propertyCard}><View style={styles.propertyHeader}><View><Text style={styles.propertyName}>{property.name}</Text><Text style={styles.listSub}>{property.location}</Text></View><StatusPill label={`${property.collection} تحصيل`} tone={property.tone} /></View><View style={styles.progressTrack}><View style={[styles.progress, { width: `${Math.round((property.occupied / property.units) * 100)}%` }]} /></View><View style={styles.propertyFooter}><Text style={styles.metaLabel}>{property.occupied} مؤجرة من {property.units} وحدة</Text><Text style={styles.metaLabel}>{Math.round((property.occupied / property.units) * 100)}% إشغال</Text></View></View>)}
        </>}

        <View style={styles.footerHint}><MaterialIcons name="verified-user" size={17} color="#0F766E" /><Text style={styles.footerText}>العزل والصلاحيات والترحيل المحاسبي تُفرض على Django/PostgreSQL/RLS</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionHeading({ title, actionLabel, onPress }: { title: string; actionLabel: string; onPress: () => void }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.sectionAction}>{actionLabel}</Text></Pressable></View>; }
function QuickAction({ icon, label, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.quickAction}><View style={styles.quickIcon}><MaterialIcons name={icon} size={21} color="#0F766E" /></View><Text style={styles.quickLabel}>{label}</Text></Pressable>; }
function Activity({ item }: { item: (typeof snapshot.notifications)[number] }) { return <View style={styles.activity}><View style={[styles.activityIcon, { backgroundColor: `${toneColor[item.tone]}16` }]}><MaterialIcons name={item.tone === "success" ? "check-circle-outline" : "notifications-none"} size={19} color={toneColor[item.tone]} /></View><View style={styles.listMain}><Text style={styles.listTitle}>{item.title}</Text><Text style={styles.listSub}>{item.body}</Text></View><Text style={styles.time}>{item.time}</Text></View>; }

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, writingDirection: "rtl" },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  logo: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#0F766E", alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 21, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  bell: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", position: "relative" },
  badge: { position: "absolute", top: 5, left: 5, width: 15, height: 15, borderRadius: 8, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  welcome: { marginTop: 28, alignItems: "flex-end" },
  eyebrow: { fontSize: 12, color: "#0F766E", fontWeight: "700", marginBottom: 8 },
  title: { textAlign: "right", fontSize: 28, lineHeight: 35, color: "#0F172A", fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { textAlign: "right", color: "#64748B", fontSize: 14, lineHeight: 22, marginTop: 7 },
  mockTag: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 11, backgroundColor: "#FEF3C7", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 }, mockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#B45309" }, mockText: { color: "#92400E", fontSize: 10, fontWeight: "700" },
  roleRow: { gap: 8, paddingVertical: 20, flexDirection: "row-reverse" },
  roleChip: { height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  roleChipActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  roleText: { fontSize: 13, color: "#475569", fontWeight: "700" }, roleTextActive: { color: "#FFFFFF" },
  metricsRow: { flexDirection: "row-reverse", gap: 9, marginBottom: 20 },
  metric: { flex: 1, minHeight: 126, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 13, alignItems: "flex-end", borderWidth: 1, borderColor: "#EDF0F2" },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", alignSelf: "flex-end", marginBottom: 9 },
  metricValue: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 4 }, metricLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", textAlign: "right" },
  notice: { backgroundColor: "#E7F5F1", borderRadius: 14, padding: 12, flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 18 }, noticeText: { flex: 1, color: "#0F766E", fontSize: 12, textAlign: "right", fontWeight: "700" },
  sectionHeading: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 7, marginBottom: 10 }, sectionTitle: { fontSize: 18, color: "#0F172A", fontWeight: "800" }, sectionAction: { fontSize: 12, color: "#0F766E", fontWeight: "700" },
  contractCard: { backgroundColor: "#0F766E", borderRadius: 22, padding: 18, marginBottom: 19 }, contractTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" }, cardKicker: { color: "#B8E4DB", fontSize: 12, fontWeight: "700", textAlign: "right" }, contractUnit: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 5, textAlign: "right" }, divider: { height: 1, backgroundColor: "#FFFFFF30", marginVertical: 17 }, contractMeta: { flexDirection: "row-reverse", justifyContent: "space-between" }, metaLabel: { color: "#64748B", fontSize: 11, textAlign: "right" },
  metaValue: { color: "#FFFFFF", fontSize: 12, marginTop: 5, textAlign: "right" }, metaRight: { alignItems: "flex-start" }, money: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginTop: 4 },
  pill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }, pillDot: { width: 6, height: 6, borderRadius: 3 }, pillText: { fontSize: 10, fontWeight: "800" },
  listCard: { backgroundColor: "#FFFFFF", borderRadius: 17, padding: 13, marginBottom: 9, flexDirection: "row-reverse", alignItems: "center", borderWidth: 1, borderColor: "#EDF0F2" }, listIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginLeft: 10 }, listMain: { flex: 1, alignItems: "flex-end" }, listTitle: { fontSize: 13, color: "#0F172A", fontWeight: "800", textAlign: "right" }, listSub: { color: "#64748B", fontSize: 11, marginTop: 4, textAlign: "right" }, listSide: { alignItems: "flex-start", gap: 6 }, listAmount: { color: "#0F172A", fontSize: 13, fontWeight: "800" },
  actionGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginBottom: 19 }, quickAction: { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 15, alignItems: "flex-end", borderWidth: 1, borderColor: "#EDF0F2" }, quickIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#E7F5F1", alignItems: "center", justifyContent: "center", marginBottom: 10 }, quickLabel: { color: "#0F172A", fontSize: 13, fontWeight: "800" },
  activity: { backgroundColor: "#FFFFFF", borderRadius: 17, padding: 13, marginBottom: 9, flexDirection: "row-reverse", alignItems: "center", borderWidth: 1, borderColor: "#EDF0F2" }, activityIcon: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center", marginLeft: 10 }, time: { color: "#94A3B8", fontSize: 10, alignSelf: "flex-start" },
  propertyCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#EDF0F2" }, propertyHeader: { flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "space-between" }, propertyName: { color: "#0F172A", fontSize: 15, fontWeight: "800", textAlign: "right" }, progressTrack: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, marginTop: 16, overflow: "hidden" }, progress: { height: 8, backgroundColor: "#0F766E", borderRadius: 4 }, propertyFooter: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 9 }, footerHint: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 }, footerText: { color: "#64748B", fontSize: 11, fontWeight: "600" },
});
