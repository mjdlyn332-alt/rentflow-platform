import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth/auth-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <ScreenContainer containerClassName="bg-[#F7F8F6]" safeAreaClassName="bg-[#F7F8F6]">
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>حساب المستخدم</Text>
        <Text style={styles.title}>الملف الشخصي</Text>
        <Text style={styles.subtitle}>بيانات الحساب والصلاحيات مصدرها خادم Django.</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <MaterialIcons name="person-outline" size={30} color="#0F766E" />
          </View>
          <Text style={styles.name}>{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "مستخدم RentFlow"}</Text>
          <Text style={styles.username}>{user?.username || "—"}</Text>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="البريد الإلكتروني" value={user?.email || "—"} />
          <DetailRow label="الهاتف" value={user?.phone || "—"} />
          <DetailRow label="الدور" value={user?.role || "—"} />
          <DetailRow label="المنشأة" value={user?.organization || "—"} last />
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="تسجيل الخروج" onPress={handleSignOut} style={styles.logout}>
          <MaterialIcons name="logout" size={20} color="#B42318" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, writingDirection: "rtl" },
  eyebrow: { color: "#0F766E", fontWeight: "700", fontSize: 12, textAlign: "right", marginTop: 12 },
  title: { color: "#0F172A", fontWeight: "800", fontSize: 28, textAlign: "right", marginTop: 8 },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 22, textAlign: "right", marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 22, alignItems: "center", borderWidth: 1, borderColor: "#EDF0F2" },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#E7F5F1", alignItems: "center", justifyContent: "center" },
  name: { color: "#0F172A", fontWeight: "800", fontSize: 19, marginTop: 12 },
  username: { color: "#64748B", fontSize: 12, marginTop: 4 },
  detailsCard: { backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: "#EDF0F2" },
  detailRow: { paddingVertical: 15, gap: 5 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: "#EDF0F2" },
  detailLabel: { color: "#64748B", fontSize: 11, textAlign: "right" },
  detailValue: { color: "#0F172A", fontSize: 14, fontWeight: "700", textAlign: "right" },
  logout: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 14, paddingVertical: 14, marginTop: 18 },
  logoutText: { color: "#B42318", fontSize: 14, fontWeight: "800" },
});
