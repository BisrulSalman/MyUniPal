import { Header } from "@/components/Layout";
import { app } from "@/database/config";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CategoryReportScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();

  const cat = useMemo(() => String(category ?? "Others"), [category]);

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const [reportText, setReportText] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [needsRegen, setNeedsRegen] = useState<boolean>(false);

  const load = useCallback(async (force = false) => {
    try {
      setLoading(!force);
      setRegenerating(force);

      const fn = httpsCallable(getFunctions(app, "us-central1"), "getCategoryReport");
      const res = await fn({ category: cat, force });

      const data = res.data as any;
      setReportText(String(data?.reportText ?? ""));
      setPdfUrl(String(data?.pdfUrl ?? ""));
      setNeedsRegen(Boolean(data?.needsRegen ?? false));
    } catch (e: any) {
      console.log("load report error:", e);
      Alert.alert("Error", e?.message ?? "Failed to load report.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [cat]);

  useEffect(() => {
    load(false);
  }, [load]);

  const onDownload = useCallback(async () => {
    if (!pdfUrl) {
      Alert.alert("No PDF yet", "Generate the report first.");
      return;
    }
    const ok = await Linking.canOpenURL(pdfUrl);
    if (!ok) return Alert.alert("Error", "Can't open the PDF link.");
    Linking.openURL(pdfUrl);
  }, [pdfUrl]);

  return (
    <View style={{ flex: 1 }}>
      <Header title={`${cat} Report`} onBack={() => router.back()} />

      <View style={styles.container}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, regenerating && { opacity: 0.6 }]}
            disabled={regenerating}
            onPress={() => load(true)}
          >
            <Text style={styles.btnText}>{regenerating ? "Generating..." : "Regenerate Report"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnOutline]} onPress={onDownload}>
            <Text style={styles.btnOutlineText}>Download PDF</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10, fontWeight: "700" }}>Loading report…</Text>
          </View>
        ) : (
          <ScrollView style={styles.reportBox} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
            {needsRegen && (
              <Text style={styles.badge}>
                New feedback detected. Press “Regenerate Report” to update.
              </Text>
            )}

            <Text style={styles.reportText}>
              {reportText || "No report yet. Press “Regenerate Report” to generate one."}
            </Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#c8d2ea", padding: 14 },

  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },

  btn: {
    flex: 1,
    backgroundColor: "#0c1c37",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0c1c37",
  },
  btnText: { color: "#fff", fontWeight: "900" },

  btnOutline: {
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0c1c37",
  },
  btnOutlineText: { color: "#0c1c37", fontWeight: "900" },

  reportBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0c1c37",
  },

  reportText: { color: "#0c1c37", fontWeight: "700", fontSize: 14, lineHeight: 20 },

  badge: {
    marginBottom: 10,
    backgroundColor: "#fff3cd",
    color: "#6b4e00",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffe69c",
    fontWeight: "800",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
