import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!username.trim() || !password) return;
    setSubmitting(true);
    try {
      await signIn(username, password);
      router.replace("/");
    } catch { /* AuthProvider exposes the safe server message. */ }
    finally { setSubmitting(false); }
  }

  return <ScreenContainer containerClassName="bg-[#F7F8F6]" safeAreaClassName="bg-[#F7F8F6]"><View style={styles.page}>
    <View style={styles.brand}><View style={styles.logo}><MaterialIcons name="key" size={24} color="#FFFFFF" /></View><Text style={styles.brandName}>RentFlow</Text><Text style={styles.tagline}>إدارة الإيجارات بوضوح وثقة</Text></View>
    <View style={styles.card}><Text style={styles.eyebrow}>تسجيل الدخول</Text><Text style={styles.title}>مرحباً بعودتك</Text><Text style={styles.subtitle}>استخدم حسابك للوصول إلى منشأتك وصلاحياتك.</Text>
      <Text style={styles.label}>البريد الإلكتروني أو اسم المستخدم</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="name@example.com" placeholderTextColor="#94A3B8" style={styles.input} textAlign="right" />
      <Text style={styles.label}>كلمة المرور</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="أدخل كلمة المرور" placeholderTextColor="#94A3B8" style={styles.input} textAlign="right" />
      {error && <View style={styles.error}><MaterialIcons name="error-outline" size={18} color="#B42318" /><Text style={styles.errorText}>{error}</Text></View>}
      <Pressable disabled={submitting} onPress={submit} style={[styles.button, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>دخول آمن</Text><MaterialIcons name="arrow-back" size={20} color="#FFFFFF" /></>}</Pressable>
      <Text style={styles.security}>الجلسة قصيرة العمر، وجميع الصلاحيات تُفحص على خادم Django.</Text>
    </View>
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, padding: 22, justifyContent: "center", writingDirection: "rtl" }, brand: { alignItems: "center", marginBottom: 24 }, logo: { width: 58, height: 58, borderRadius: 20, backgroundColor: "#0F766E", alignItems: "center", justifyContent: "center" }, brandName: { color: "#0F172A", fontSize: 26, fontWeight: "800", marginTop: 10 }, tagline: { color: "#64748B", fontSize: 12, marginTop: 5 }, card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 21, borderWidth: 1, borderColor: "#E7ECEB" }, eyebrow: { color: "#0F766E", fontWeight: "800", fontSize: 12, textAlign: "right" }, title: { color: "#0F172A", fontWeight: "800", fontSize: 25, textAlign: "right", marginTop: 8 }, subtitle: { color: "#64748B", fontSize: 13, lineHeight: 20, textAlign: "right", marginTop: 7, marginBottom: 20 }, label: { color: "#334155", fontWeight: "700", fontSize: 12, textAlign: "right", marginTop: 12, marginBottom: 7 }, input: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: "#CBD5E1", paddingHorizontal: 13, color: "#0F172A", backgroundColor: "#FAFCFC" }, error: { flexDirection: "row-reverse", alignItems: "center", gap: 7, backgroundColor: "#FEF2F2", borderRadius: 11, padding: 10, marginTop: 14 }, errorText: { flex: 1, color: "#B42318", fontSize: 12, textAlign: "right", lineHeight: 18 }, button: { height: 50, borderRadius: 14, backgroundColor: "#0F766E", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }, disabled: { opacity: 0.65 }, buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 }, security: { color: "#64748B", fontSize: 10, textAlign: "center", lineHeight: 16, marginTop: 16 } });
