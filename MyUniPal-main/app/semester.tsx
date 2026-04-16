import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../components/Layout";
import { app } from "../database/config";
type Subject = { name: string; grade: string; credits: string };

const STORAGE_KEY = "semesterResults";

const gradePoints: Record<string, number> = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0,
  E: 0.0, F: 0.0,
};

const EMPTY_SUBJECTS = Array.from({ length: 10 }, () => ({
  name: "",
  grade: "",
  credits: "",
}));

export default function SemesterScreen() {
  const router = useRouter();

  // expo-router params are strings
  const params = useLocalSearchParams<{ semester?: string }>();
  const semester = useMemo(() => params.semester ?? "Semester", [params.semester]);

  const [subjects, setSubjects] = useState<Subject[]>(EMPTY_SUBJECTS);
  const [gpa, setGpa] = useState("0.00");
  const [totalCredits, setTotalCredits] = useState(0);
  const [insights, setInsights] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const gradeOptions = useMemo(() => [""].concat(Object.keys(gradePoints)), []);

  // ✅ Load this semester data from AsyncStorage when screen opens
  useEffect(() => {
    const loadSemester = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const allResults = stored ? JSON.parse(stored) : {};
        const data = allResults[semester];

        if (data) {
          setSubjects(Array.isArray(data.subjects) ? data.subjects : EMPTY_SUBJECTS);
          setGpa(typeof data.gpa === "string" ? data.gpa : "0.00");
          setTotalCredits(typeof data.totalCredits === "number" ? data.totalCredits : 0);
        } else {
          setSubjects(EMPTY_SUBJECTS);
          setGpa("0.00");
          setTotalCredits(0);
          setInsights("");
        }
      } catch (e) {
        console.log("loadSemester error:", e);
      }
    };

    loadSemester();
  }, [semester]);

  // ✅ Save whenever subjects/gpa/credits change
  useEffect(() => {
    const saveData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const allResults = stored ? JSON.parse(stored) : {};
        allResults[semester] = { gpa, totalCredits, subjects };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allResults));
      } catch (error) {
        console.error("Error saving semester data:", error);
      }
    };
    saveData();
  }, [semester, gpa, totalCredits, subjects]);

  const handleInputChange = (index: number, field: keyof Subject, value: string) => {
    setSubjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const openGradeModal = (index: number) => {
    setModalIndex(index);
    setModalVisible(true);
  };

  const chooseGrade = (grade: string) => {
    if (modalIndex !== null) handleInputChange(modalIndex, "grade", grade);
    setModalVisible(false);
    setModalIndex(null);
  };

  const filledSubjects = subjects.filter((s) => {
  const credits = parseFloat(s.credits);
  return (
    s.name.trim().length > 0 &&
    s.grade.trim().length > 0 &&
    !Number.isNaN(credits) &&
    credits > 0
  );
});

  const callGroqInsights = async (sgpaValue: string, creditSum: number) => {
  try {
    setInsights("Generating insights...");

    const functions = getFunctions(app, "us-central1");
    const fn = httpsCallable(functions, "getGpaInsights");

    const filledSubjects = subjects.filter((s) => {
      const credits = parseFloat(s.credits);
      return (
        s.name.trim().length > 0 &&
        s.grade.trim().length > 0 &&
        !Number.isNaN(credits) &&
        credits > 0
      );
    });

    const res = await fn({
      semester,
      sgpa: Number(sgpaValue),
      totalCredits: creditSum,
      subjects: filledSubjects, // ✅ FIX
    });

    const data = res.data as { insight: string };
    setInsights(data.insight || "No insights returned.");
  } catch (e) {
    console.log("insights error:", e);
    setInsights("Could not generate insights right now. Please try again.");
  }
};


  const calculateGPA = async () => {
    let totalPoints = 0;
    let creditSum = 0;

    subjects.forEach(({ grade, credits }) => {
      const creditVal = parseFloat(credits);
      const gradeVal = gradePoints[grade] ?? 0;

      if (!Number.isNaN(creditVal) && creditVal > 0) {
        totalPoints += gradeVal * creditVal;
        creditSum += creditVal;
      }
    });

    if (creditSum === 0) {
      Alert.alert("Invalid input", "Please enter at least one valid credit value.");
      return;
    }

    const calculatedGpa = (totalPoints / creditSum).toFixed(2);
    setGpa(calculatedGpa);
    setTotalCredits(creditSum);

    const lowGrades = subjects
      .map((s, i) => ({ ...s, idx: i + 1 }))
      .filter((s) => {
        const gp = gradePoints[s.grade] ?? 0;
        const c = parseFloat(s.credits);
        return !Number.isNaN(c) && c > 0 && gp < 2.0;
      });

    let autoInsight = `SGPA: ${calculatedGpa}.`;
    if (lowGrades.length) {
      autoInsight += ` Consider reviewing: ${lowGrades
        .map((s) => s.name?.trim() || `Subject #${s.idx}`)
        .join(", ")}.`;
    } else {
      autoInsight += " Great performance overall!";
    }
    await callGroqInsights(calculatedGpa, creditSum);
  };

  

  const resetFields = () => {
    setSubjects(EMPTY_SUBJECTS);
    setGpa("0.00");
    setTotalCredits(0);
    setInsights("");
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={semester} onBack={() => router.back()} />

      <SafeAreaView style={styles.container}>
        <Text style={styles.gpaText}>GPA : {gpa}</Text>
        <Text style={styles.creditText}>Total Credits : {totalCredits}</Text>

        {/* ✅ Split layout */}
        <View style={styles.topHalf}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {subjects.map((subject, index) => (
              <View key={index} style={styles.subjectRow}>
                <TextInput
                  placeholder="Subject"
                  style={[styles.input, { flex: 1.5 }]}
                  value={subject.name}
                  onChangeText={(text) => handleInputChange(index, "name", text)}
                />

                <TouchableOpacity
                  style={[styles.input, styles.gradeBox]}
                  onPress={() => openGradeModal(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.gradeText, subject.grade ? null : styles.placeholderText]}>
                    {subject.grade || "Grade"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  placeholder="Credits"
                  style={[styles.input, styles.creditBox]}
                  keyboardType="numeric"
                  value={subject.credits}
                  onChangeText={(text) => handleInputChange(index, "credits", text)}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomBtns}>
          <TouchableOpacity style={styles.calcBtn} onPress={calculateGPA}>
            <Text style={styles.btnText}>Calculate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFields}>
            <Text style={styles.btnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomHalf}>
          <View style={styles.insightsWrap}>
            <Text style={styles.insightsLabel}>Insights from MyUniPal</Text>
            <View style={styles.insightsBox}>
              <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingBottom: 12 }}
    showsVerticalScrollIndicator={true}
  >
    <Text style={styles.insightsText}>
      {insights || "MyUnipal is thinking..."}
    </Text>
  </ScrollView>
            </View>
          </View>
        </View>

        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Grade</Text>

                  <FlatList
                    data={gradeOptions}
                    keyExtractor={(item, idx) => `${item}-${idx}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.gradeItem} onPress={() => chooseGrade(item)}>
                        <Text style={[styles.gradeItemText, item === "" ? styles.placeholderText : null]}>
                          {item === "" ? "Select Grade" : item}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.sep} />}
                    showsVerticalScrollIndicator={false}
                  />

                  <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#c8d2ea", paddingHorizontal: 12 },

  gpaText: { fontSize: 25, fontWeight: "700", marginTop: 6, textAlign: "center" },
  creditText: { fontSize: 15, textAlign: "center", marginBottom: 10 },

  topHalf: { flex: 1 },
  bottomHalf: { flex: 1, paddingTop: 10 },

  scrollContent: { paddingBottom: 10 },

  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    backgroundColor: "#fff",
    height: 40,
    marginHorizontal: 4,
  },

  gradeBox: { flex: 0.8, justifyContent: "center", alignItems: "center" },
  gradeText: { fontSize: 15 },
  creditBox: { width: 55, textAlign: "center", height: 40 },
  placeholderText: { color: "#999" },

  bottomBtns: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },

  calcBtn: { backgroundColor: "#0a1e45", marginTop:15, paddingVertical: 10, borderRadius: 8, width: 120, alignItems: "center" },
  resetBtn: { backgroundColor: "#0a1e45", marginTop:15,paddingVertical: 10, borderRadius: 8, width: 120, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },

  insightsWrap: { flex: 1, marginHorizontal: 8 },
  insightsLabel: { color: "#444", marginTop: 10,marginBottom: 10, fontSize:20,fontWeight: "700" },

  insightsBox: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 12,
    justifyContent: "center",
  },

  insightsText: { color: "#333", fontSize: 16, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(10, 30, 69, 0.45)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, maxHeight: "70%", paddingVertical: 12, paddingHorizontal: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  gradeItem: { paddingVertical: 12, paddingHorizontal: 8 },
  gradeItemText: { fontSize: 16 },
  sep: { height: 1, backgroundColor: "#ececec" },
  modalClose: { paddingVertical: 12, marginTop: 8, alignItems: "center" },
  modalCloseText: { color: "#0a1e45", fontWeight: "700" },
});
