import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const GOLD = "#C79A4A";
const INK = "#171717";
const MUTED = "#6E6A65";
const PAPER = "#F7F5F1";
const CARD = "#FFFFFF";
const LINE = "#E7E1D8";
const DANGER = "#B94C4C";
const FIREBASE_API_URL = (process.env.EXPO_PUBLIC_FIREBASE_API_URL || "").replace(/\/$/, "");

type Choice = { label: string; value: string };

type FormData = {
  fullName: string;
  company: string;
  jobTitle: string;
  phone: string;
  email: string;
  wilaya: string;
  businessType: string;
  otherBusiness: string;
  products: string[];
  otherProduct: string;
  discovery: string[];
  workedWithGph: string;
  needs: string;
  contactGoals: string[];
  otherGoal: string;
  orderSize: string;
  purchaseTiming: string;
  preferredContact: string;
  notes: string;
  followUpDate: string;
  interest: string;
};

const EMPTY_FORM: FormData = {
  fullName: "", company: "", jobTitle: "", phone: "", email: "", wilaya: "",
  businessType: "", otherBusiness: "", products: [], otherProduct: "", discovery: [],
  workedWithGph: "", needs: "", contactGoals: [], otherGoal: "", orderSize: "",
  purchaseTiming: "", preferredContact: "", notes: "", followUpDate: "", interest: "",
};

const businessTypes: Choice[] = [
  { label: "موزع منتجات", value: "distributor" }, { label: "تاجر جملة", value: "wholesaler" },
  { label: "تاجر تجزئة", value: "retailer" }, { label: "محل أو مركز تجميل", value: "beauty" },
  { label: "صيدلية أو شبه صيدلية", value: "pharmacy" }, { label: "فندق أو شركة خدمات", value: "hospitality" },
  { label: "مؤسسة إعلامية", value: "media" }, { label: "مؤسسة أخرى", value: "other" },
];
const productChoices: Choice[] = [
  { label: "منتجات العناية بالبشرة", value: "skin" }, { label: "منتجات تعطير منزلية", value: "home" },
  { label: "مجموعة العطور والعناية الشخصية", value: "fragrance" }, { label: "منتجات التعطير للمؤسسات والفضاءات المهنية", value: "professional" },
  { label: "منتجات أخرى", value: "other" },
];
const discoveryChoices: Choice[] = [
  { label: "Facebook", value: "facebook" }, { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" }, { label: "غير ذلك", value: "other" },
];
const goalChoices: Choice[] = [
  { label: "شراء المنتجات", value: "purchase" }, { label: "التوزيع وإعادة البيع", value: "resale" },
  { label: "بحث عن شراكة تجارية", value: "partnership" }, { label: "الحصول على قائمة الأسعار والعروض", value: "pricing" },
  { label: "التعرف على منتجات الشركة فقط", value: "explore" }, { label: "هدف آخر", value: "other" },
];
const orderSizes: Choice[] = [
  { label: "طلب تجريبي", value: "trial" }, { label: "كمية متوسطة", value: "medium" },
  { label: "كميات كبيرة بالجملة", value: "bulk" }, { label: "يتحدد حسب الأسعار والعروض", value: "flexible" },
];
const purchaseTimings: Choice[] = [
  { label: "في أقرب وقت", value: "soon" }, { label: "خلال الشهر القادم", value: "month" },
  { label: "خلال ثلاثة أشهر", value: "quarter" }, { label: "غير محدد حالياً", value: "later" },
];
const contactChoices: Choice[] = [
  { label: "واتساب", value: "whatsapp" }, { label: "اتصال هاتفي", value: "phone" }, { label: "البريد الإلكتروني", value: "email" },
];
const interestChoices: Choice[] = [
  { label: "مرتفع", value: "high" }, { label: "متوسط", value: "medium" }, { label: "منخفض", value: "low" },
];

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return <View style={styles.sectionHeader}><View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{number}</Text></View><View style={styles.sectionHeadingCopy}><Text style={styles.sectionTitle}>{title}</Text>{subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}</View></View>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, error }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "phone-pad" | "email-address"; multiline?: boolean; error?: boolean }) {
  return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? "اكتب هنا"} placeholderTextColor="#AAA39A" keyboardType={keyboardType} multiline={multiline} textAlign="right" textAlignVertical={multiline ? "top" : "center"} style={[styles.input, multiline && styles.multilineInput, error && styles.inputError]} /></View>;
}
function Option({ label, selected, onPress, multiple = false }: { label: string; selected: boolean; onPress: () => void; multiple?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}><View style={[styles.optionIndicator, multiple ? styles.checkbox : styles.radio, selected && styles.optionIndicatorSelected]}>{selected ? <MaterialIcons name={multiple ? "check" : "fiber-manual-record"} size={multiple ? 15 : 9} color={multiple ? CARD : GOLD} /> : null}</View><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text></Pressable>;
}
function ChoiceGroup({ choices, selected, onSelect, multiple = false, columns = 1 }: { choices: Choice[]; selected: string | string[]; onSelect: (value: string) => void; multiple?: boolean; columns?: number }) {
  return <View style={[styles.optionsGrid, columns === 2 && styles.twoColumns]}>{choices.map((choice) => { const isSelected = multiple ? (selected as string[]).includes(choice.value) : selected === choice.value; return <View key={choice.value} style={columns === 2 ? styles.optionColumn : undefined}><Option label={choice.label} selected={isSelected} onPress={() => onSelect(choice.value)} multiple={multiple} /></View>; })}</View>;
}

export default function HomeScreen() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: "products" | "discovery" | "contactGoals", value: string) => { const current = form[key]; update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); };
  const errors = useMemo(() => ({ fullName: attempted && !form.fullName.trim(), phone: attempted && !form.phone.trim(), businessType: attempted && !form.businessType, products: attempted && form.products.length === 0, contactGoals: attempted && form.contactGoals.length === 0, interest: attempted && !form.interest }), [attempted, form]);
  const startNew = () => { setForm(EMPTY_FORM); setAttempted(false); setSubmitted(false); };
  const saveForm = async () => {
    setAttempted(true);
    if (!form.fullName.trim() || !form.phone.trim() || !form.businessType || form.products.length === 0 || form.contactGoals.length === 0 || !form.interest) return;
    setSaving(true);
    try {
      if (!FIREBASE_API_URL) throw new Error("missing-firebase-api-url");
      const record = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
      const response = await fetch(`${FIREBASE_API_URL}/api/firebase/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
      if (!response.ok) throw new Error("firebase-api-failed");
      setSubmitted(true);
    } catch {
      if (Platform.OS === "web") window.alert("تعذر حفظ الاستمارة. حاول مرة أخرى.");
      else Alert.alert("تعذر الحفظ", "حدث خطأ أثناء حفظ الاستمارة، حاول مرة أخرى.");
    } finally { setSaving(false); }
  };
  if (submitted) return <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}><View style={styles.successScreen}><View style={styles.successMark}><MaterialIcons name="check" size={38} color={CARD} /></View><Text style={styles.successKicker}>GPH · COSMENEX</Text><Text style={styles.successTitle}>تم حفظ الاستمارة</Text><Text style={styles.successText}>شكراً لتواصلكم مع شركة GPH. تم تسجيل معلومات العميل بنجاح ويمكنكم متابعة التواصل حسب البيانات المدخلة.</Text><Pressable onPress={startNew} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><MaterialIcons name="add" size={20} color={CARD} /><Text style={styles.primaryButtonText}>بدء استمارة جديدة</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.brandBar}><View style={styles.brandMark}><Text style={styles.brandMarkText}>G</Text></View><View style={styles.brandCopy}><Text style={styles.brandName}>GPH</Text><Text style={styles.brandTagline}>MY ROSE &amp; GLORY COLLECTION</Text></View><Text style={styles.brandUrl}>gph.com.dz</Text></View>
    <View style={styles.hero}><View style={styles.heroEyebrow}><View style={styles.goldDot} /><Text style={styles.eyebrowText}>معرض COSMENEX · 2026</Text></View><Text style={styles.title}>استمارة معلومات{`\n`}الزوار والعملاء المحتملين</Text><Text style={styles.subtitle}>التواصل التجاري وتطوير الشراكات</Text><Text style={styles.intro}>نستمع لاحتياجاتكم لنصنع فرصة تعاون مناسبة.</Text></View>
    <View style={styles.progressRow}><Text style={styles.progressLabel}>استمارة تقييم العميل</Text><Text style={styles.progressHint}>املأ الحقول المطلوبة <Text style={styles.required}>*</Text></Text></View>
    <View style={styles.card}><SectionHeader number="01" title="المعلومات الشخصية والمهنية" subtitle="بيانات التواصل الأساسية" /><Field label="الاسم واللقب *" value={form.fullName} onChangeText={(v) => update("fullName", v)} placeholder="الاسم الكامل" error={errors.fullName} /><Field label="اسم الشركة أو المؤسسة" value={form.company} onChangeText={(v) => update("company", v)} placeholder="اسم الشركة" /><Field label="الوظيفة" value={form.jobTitle} onChangeText={(v) => update("jobTitle", v)} placeholder="المسمى الوظيفي" /><Field label="رقم الهاتف *" value={form.phone} onChangeText={(v) => update("phone", v)} placeholder="05 / 06 / 07 ..." keyboardType="phone-pad" error={errors.phone} /><Field label="البريد الإلكتروني" value={form.email} onChangeText={(v) => update("email", v)} placeholder="name@company.com" keyboardType="email-address" /><Field label="الولاية" value={form.wilaya} onChangeText={(v) => update("wilaya", v)} placeholder="اكتب الولاية" /></View>
    <View style={styles.card}><SectionHeader number="02" title="طبيعة النشاط التجاري" /><Text style={styles.groupHint}>اختر الخيار الأقرب لنشاط العميل <Text style={styles.required}>*</Text></Text><ChoiceGroup choices={businessTypes} selected={form.businessType} onSelect={(v) => update("businessType", v)} columns={2} />{form.businessType === "other" ? <Field label="اذكر طبيعة النشاط" value={form.otherBusiness} onChangeText={(v) => update("otherBusiness", v)} placeholder="نشاط آخر" /> : null}</View>
    <View style={styles.card}><SectionHeader number="03" title="المنتجات التي تهمكم" subtitle="من شركة GPH · يمكن اختيار أكثر من خيار" /><ChoiceGroup choices={productChoices} selected={form.products} onSelect={(v) => toggle("products", v)} multiple />{form.products.includes("other") ? <Field label="منتجات أخرى" value={form.otherProduct} onChangeText={(v) => update("otherProduct", v)} placeholder="اكتب المنتجات" /> : null}<View style={styles.divider} /><Text style={styles.question}>كيف عرفتم بشركة GPH؟</Text><ChoiceGroup choices={discoveryChoices} selected={form.discovery} onSelect={(v) => toggle("discovery", v)} multiple columns={2} /><Text style={styles.question}>هل سبق لكم التعامل مع شركة GPH؟</Text><ChoiceGroup choices={[{ label: "نعم", value: "yes" }, { label: "لا", value: "no" }]} selected={form.workedWithGph} onSelect={(v) => update("workedWithGph", v)} columns={2} /><Field label="أهم الاحتياجات أو المتطلبات" value={form.needs} onChangeText={(v) => update("needs", v)} placeholder="شاركنا ما تبحث عنه" multiline /></View>
    <View style={styles.card}><SectionHeader number="04" title="هدف التواصل مع شركة GPH" /><ChoiceGroup choices={goalChoices} selected={form.contactGoals} onSelect={(v) => toggle("contactGoals", v)} multiple />{form.contactGoals.includes("other") ? <Field label="هدف آخر" value={form.otherGoal} onChangeText={(v) => update("otherGoal", v)} placeholder="حدد الهدف" /> : null}</View>
    <View style={styles.card}><SectionHeader number="05" title="الكمية المتوقعة وموعد الشراء" /><Text style={styles.question}>حجم الطلب المتوقع</Text><ChoiceGroup choices={orderSizes} selected={form.orderSize} onSelect={(v) => update("orderSize", v)} /><Text style={styles.question}>موعد الشراء المتوقع</Text><ChoiceGroup choices={purchaseTimings} selected={form.purchaseTiming} onSelect={(v) => update("purchaseTiming", v)} /></View>
    <View style={styles.card}><SectionHeader number="06" title="المتابعة بعد معرض Cosmenex" subtitle="لنواصل الحديث في الوقت المناسب" /><Text style={styles.question}>وسيلة التواصل المفضلة</Text><ChoiceGroup choices={contactChoices} selected={form.preferredContact} onSelect={(v) => update("preferredContact", v)} columns={2} /><Field label="ملاحظات ممثل شركة GPH" value={form.notes} onChangeText={(v) => update("notes", v)} placeholder="ملاحظات إضافية" multiline /><Field label="تاريخ المتابعة" value={form.followUpDate} onChangeText={(v) => update("followUpDate", v)} placeholder="مثال: 15 / 11 / 2026" /><Text style={styles.question}>درجة اهتمام العميل <Text style={styles.required}>*</Text></Text><ChoiceGroup choices={interestChoices} selected={form.interest} onSelect={(v) => update("interest", v)} columns={3} /></View>
    {attempted && (errors.fullName || errors.phone || errors.businessType || errors.products || errors.contactGoals || errors.interest) ? <View style={styles.validation}><MaterialIcons name="info-outline" size={19} color={DANGER} /><Text style={styles.validationText}>يرجى إكمال الحقول المطلوبة المشار إليها بعلامة *</Text></View> : null}
    <Pressable onPress={saveForm} disabled={saving} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, saving && styles.disabled]}><Text style={styles.submitButtonText}>{saving ? "جارٍ الحفظ..." : "حفظ وإرسال الاستمارة"}</Text><MaterialIcons name="arrow-back" size={22} color={CARD} /></Pressable><Text style={styles.privacyNote}>تحفظ البيانات على هذا الجهاز فقط</Text><Text style={styles.footer}>EURL BAIT EL OUTOUR EL ALAMIA · SETIF</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: PAPER }, scrollContent: { paddingHorizontal: 16, paddingBottom: 44 },
  brandBar: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE, gap: 10 }, brandMark: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: GOLD }, brandMarkText: { color: GOLD, fontSize: 24, fontWeight: "800" }, brandCopy: { flex: 1, alignItems: "flex-end" }, brandName: { fontSize: 18, fontWeight: "800", letterSpacing: 2, color: INK }, brandTagline: { fontSize: 8, letterSpacing: 1.1, color: MUTED, marginTop: 2 }, brandUrl: { fontSize: 10, color: MUTED, fontWeight: "600" },
  hero: { paddingTop: 26, paddingBottom: 22, alignItems: "flex-end" }, heroEyebrow: { flexDirection: "row-reverse", alignItems: "center", gap: 7, marginBottom: 12 }, goldDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD }, eyebrowText: { color: GOLD, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }, title: { width: "100%", textAlign: "right", color: INK, fontSize: 30, lineHeight: 39, fontWeight: "800" }, subtitle: { width: "100%", textAlign: "right", color: MUTED, fontSize: 14, fontWeight: "600", marginTop: 10 }, intro: { width: "100%", textAlign: "right", color: MUTED, fontSize: 13, lineHeight: 21, marginTop: 16 }, progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 }, progressLabel: { color: INK, fontSize: 12, fontWeight: "800" }, progressHint: { color: MUTED, fontSize: 11 }, required: { color: DANGER },
  card: { backgroundColor: CARD, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: LINE, shadowColor: "#1A140B", shadowOpacity: 0.035, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, sectionHeader: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 19, gap: 11 }, sectionNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: INK, justifyContent: "center", alignItems: "center" }, sectionNumberText: { color: GOLD, fontSize: 12, fontWeight: "800" }, sectionHeadingCopy: { flex: 1, alignItems: "flex-end" }, sectionTitle: { color: INK, fontSize: 18, fontWeight: "800", textAlign: "right" }, sectionSubtitle: { color: MUTED, fontSize: 11, marginTop: 3, textAlign: "right" },
  fieldWrap: { marginBottom: 14 }, fieldLabel: { color: INK, fontSize: 12, fontWeight: "700", textAlign: "right", marginBottom: 7 }, input: { minHeight: 47, borderWidth: 1, borderColor: LINE, borderRadius: 11, paddingHorizontal: 13, color: INK, backgroundColor: "#FCFBF9", fontSize: 14 }, multilineInput: { minHeight: 84, paddingTop: 13 }, inputError: { borderColor: "#D98C8C", backgroundColor: "#FFF9F8" }, groupHint: { color: MUTED, fontSize: 11, textAlign: "right", marginBottom: 10 }, optionsGrid: { gap: 8 }, twoColumns: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 }, optionColumn: { width: "50%", paddingHorizontal: 3 }, option: { minHeight: 43, borderRadius: 10, borderWidth: 1, borderColor: LINE, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row-reverse", alignItems: "center", gap: 9, backgroundColor: CARD }, optionSelected: { borderColor: GOLD, backgroundColor: "#FBF7EF" }, optionIndicator: { width: 19, height: 19, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#CFC8BD" }, radio: { borderRadius: 10 }, checkbox: { borderRadius: 5 }, optionIndicatorSelected: { borderColor: GOLD, backgroundColor: "#FBF3DF" }, optionText: { flex: 1, color: "#4C4944", fontSize: 12, lineHeight: 17, textAlign: "right" }, optionTextSelected: { color: INK, fontWeight: "700" }, pressed: { opacity: 0.75 }, divider: { height: 1, backgroundColor: LINE, marginVertical: 20 }, question: { color: INK, fontSize: 13, fontWeight: "800", textAlign: "right", marginTop: 4, marginBottom: 10 }, validation: { flexDirection: "row-reverse", alignItems: "center", gap: 7, backgroundColor: "#FFF3F1", borderColor: "#F1C8C3", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }, validationText: { color: DANGER, flex: 1, textAlign: "right", fontSize: 12, lineHeight: 18 }, submitButton: { minHeight: 56, borderRadius: 15, backgroundColor: INK, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 11, marginTop: 3 }, submitButtonText: { color: CARD, fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.6 }, privacyNote: { color: MUTED, fontSize: 11, textAlign: "center", marginTop: 13 }, footer: { textAlign: "center", color: "#A8A097", fontSize: 9, letterSpacing: 0.7, marginTop: 21 },
  successScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: PAPER }, successMark: { width: 78, height: 78, borderRadius: 39, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 22 }, successKicker: { color: GOLD, fontSize: 11, fontWeight: "800", letterSpacing: 1.3 }, successTitle: { color: INK, fontSize: 28, fontWeight: "800", marginTop: 10, textAlign: "center" }, successText: { color: MUTED, fontSize: 14, lineHeight: 24, textAlign: "center", marginTop: 14, maxWidth: 330 }, primaryButton: { backgroundColor: INK, borderRadius: 14, paddingHorizontal: 21, minHeight: 54, flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 30 }, primaryButtonText: { color: CARD, fontSize: 14, fontWeight: "800" },
});
