import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Header } from '../components/Layout';

export default function Contact() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
    {/* Header with back button */}
    <Header
      title="Contacts"
      onBack={() => router.back()}
    />
    <View style={styles.container}>
   
      {/* 🔹 Contact Cards */}
      <View style={styles.contactCard}>
        <Ionicons name="person-outline" size={28} color="#0C1C52" />
        <View style={styles.contactTextContainer}>
          <Text style={styles.contactName}>FAS</Text>
          <Text style={styles.contactInfo}>+94 24 222 0179</Text>
          <Text style={styles.contactInfo}>deanfas@vau.ac.lk</Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <Ionicons name="person-outline" size={28} color="#0C1C52" />
        <View style={styles.contactTextContainer}>
          <Text style={styles.contactName}>FBS</Text>
          <Text style={styles.contactInfo}>+94 24 222 8231</Text>
          <Text style={styles.contactInfo}>deanfbs@vau.ac.lk</Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <Ionicons name="person-outline" size={28} color="#0C1C52" />
        <View style={styles.contactTextContainer}>
          <Text style={styles.contactName}>FTS</Text>
          <Text style={styles.contactInfo}>+94 24 222 8240</Text>
          <Text style={styles.contactInfo}>deanfts@vau.ac.lk</Text>
        </View>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c8d2ea", // ✅ light blue background (matches dashboard)
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#5063C9", // ✅ matches Edit Profile button color
    padding: 10,
    borderRadius: 25,
    elevation: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0C1C52",
    marginBottom: 40,
    textAlign: "center",
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  contactTextContainer: {
    marginLeft: 12,
  },

  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C1C52",
  },

  contactInfo: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
});