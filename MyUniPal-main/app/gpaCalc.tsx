import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Header } from '../components/Layout';

export default function GPACalc() {
  const router = useRouter();
  const semesters = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
  const [semesterResults, setSemesterResults] = useState<Record<string, any>>({});

  useFocusEffect(
  useCallback(() => {
    const loadSavedData = async () => {
      try {
        const stored = await AsyncStorage.getItem("semesterResults");
        if (stored) setSemesterResults(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    };

    loadSavedData();
  }, [])
);

  const handleSemesterResult = (sem: string, result: any) => {
    setSemesterResults((prev) => ({ ...prev, [sem]: result }));
  };

  const totalCredits = Object.values(semesterResults).reduce(
    (sum, s: any) => sum + (parseFloat(s.totalCredits) || 0),
    0
  );

  const totalGradePoints = Object.values(semesterResults).reduce(
    (sum, s: any) => sum + (parseFloat(s.gpa) * (parseFloat(s.totalCredits) || 0) || 0),
    0
  );

  const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "0.00";

  const clearAll = async () => {
    setSemesterResults({});
    await AsyncStorage.removeItem("semesterResults");
  };

  return (
    <View style={{ flex: 1 }}>
    {/* Header with back button */}
    <Header
      title="GPA Calculator"
      onBack={() => router.back()}
    />
    <View style={styles.container}>
      <View style={styles.headerSpace} />

      <View style={styles.infoSection}>
        <Text style={styles.gpaText}>Cumulative GPA : {cgpa}</Text>
        <Text style={styles.creditText}>Total Credits : {totalCredits}</Text>
      </View>

      <View style={styles.semesterGrid}>
        {semesters.map((sem, index) => (
          <TouchableOpacity
            key={index}
            style={styles.semesterBtn}
            onPress={() =>
  router.push({
    pathname: "/semester",
    params: {
      semester: sem,
      existingData: semesterResults[sem] ? JSON.stringify(semesterResults[sem]) : "",
    },
  })
}

          >
            <Text style={styles.semesterBtnText}>{sem}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
        <Text style={styles.clearBtnText}>Clear All Results</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        From grades to guidance,{"\n"}shaping a brighter academic future.
      </Text>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#c8d2ea", alignItems: "center", justifyContent: "space-evenly", paddingVertical: 30 },
  headerSpace: { height: 30 },
  infoSection: { alignItems: "center" },
  gpaText: { fontSize: 30, fontWeight: "700", color: "#0a1e45" },
  creditText: { fontSize: 20, color: "#333", marginTop: 5 },
  semesterGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width: "80%" },
  semesterBtn: { backgroundColor: "#0a1e45", width: "48%", paddingVertical: 14, borderRadius: 10, marginVertical: 6, alignItems: "center" },
  semesterBtnText: { color: "#fff", fontWeight: "600" },
  clearBtn: { backgroundColor: "#0a1e45", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
  clearBtnText: { color: "#fff", fontWeight: "700" },
  footerText: { fontSize: 12, textAlign: "center", color: "#444" },
});

