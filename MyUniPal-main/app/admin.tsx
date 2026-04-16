import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native"; // keep only if you still want it
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { PieChart } from "react-native-chart-kit";
import { Header } from "../components/Layout";
import { auth } from '../database/config';
import { listRecentFeedbacks } from "../services/feedbackService";
import { getUserProfile, getUserRole } from '../services/userService';

type FeedbackItem = {
  userType: string;
  category: string;
  emoji: string;
  feedback: string;
  date: string;
}; //added

export default function AdminDashboard() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);

  const isFocused = useIsFocused();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]); //fixed
  const [avatar, setAvatar] = useState<{ uri: string } | null>(null); //fixed
  const [menuVisible, setMenuVisible] = useState(false);
  const openedOnceRef = useRef(false);
  // ✅ open menu only once (first time component mounts)
    useEffect(() => {
      if (!openedOnceRef.current) {
        setMenuVisible(true);
        openedOnceRef.current = true;
      }
    }, []);

  useEffect(() => {
  const checkAdminAccess = async () => {
    const user = auth.currentUser;

    // Not logged in
    if (!user) {
      router.replace('/login');
      return;
    }

    // Fetch role from Firestore
    const role = await getUserRole(user.uid);

    // Not admin → kick out
    if (role !== 'admin') {
      router.replace('./community');
      return;
    }

    // Admin verified
    setCheckingRole(false);
  };

  checkAdminAccess();
}, []);

  // Load feedbacks
  useEffect(() => {
  const load = async () => {
    try {
      const data = await listRecentFeedbacks(50);
      // convert Firestore timestamp into readable string for your UI
      const mapped = data.map((f) => ({
        userType: f.userType,
        category: f.category,
        emoji: f.emoji,
        feedback: f.feedback,
        date: f.createdAt?.toDate ? f.createdAt.toDate().toLocaleString() : "",
      }));
      setFeedbacks(mapped);
    } catch (e) {
      console.log("load feedbacks error:", e);
    }
  };

  if (isFocused) load();
}, [isFocused]);


  // Load avatar
  useEffect(() => {
  const loadAvatar = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const profile = await getUserProfile(uid);
      setAvatar(profile.photoURL ? { uri: profile.photoURL } : null);
    } catch (e) {
      console.log("loadAvatar error:", e);
    }
  };

  if (isFocused) loadAvatar();
}, [isFocused]);

const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (e) {
      console.log("logout error:", e);
      Alert.alert("Error", "Failed to logout.");
    }
  };

  const categories = ["Academic", "MyUniPal", "Library", "Hostel", "Others"];
  const pieColors = ["#007AFF", "#5AC8FA", "#34AADC", "#0A84FF", "#004AAD"];

  const categoryCounts: Record<string, number> = feedbacks.reduce((acc, f) => {
  const cat = f.category || "Others";
  acc[cat] = (acc[cat] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

  const totalFeedbacks = feedbacks.length || 1;

  const categoryPercentages = categories.map(
    (cat) => Math.round(((categoryCounts[cat] || 0) / totalFeedbacks) * 100)
  );

  const chartData = categories.map((cat, index) => ({
    name: cat,
    population: categoryCounts[cat] || 0.01,
    color: pieColors[index],
    legendFontColor: "#333",
    legendFontSize: 12,
  }));

  const screenWidth = Dimensions.get("window").width;
  // ✅ Typed route map (Fix A)
const TOP_CATEGORY_ROUTES = {
  Academic: "/topCategories/academic",
  MyUniPal: "/topCategories/myunipal",
  Library: "/topCategories/library",
  Hostel: "/topCategories/hostel",
  Others: "/topCategories/others",
} as const;

type Category = keyof typeof TOP_CATEGORY_ROUTES;

  if (checkingRole) {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

  return (
    <View style={{ flex: 1 }}>
    {/* Header with back button */}
    <Header
      title="Admin Dashboard"
      onBack={() => router.back()}
    />

    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 180,
            paddingHorizontal: 20,
            paddingBottom: 30,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Menu */}
          {menuVisible ? (
            <View style={local.menuWrapper}>
              <View style={local.halfRoundBlurContainer}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

                {avatar ? (
                  <Image source={avatar} style={local.menuAvatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={50} color="#ccc" />
                )}

                <View style={local.menuItems}>
                  <TouchableOpacity
                    style={local.menuButton}
                    onPress={() => {
                      setMenuVisible(false);
                      router.push('./editProfile')
                    }}
                  >
                    <Ionicons name="person-outline" size={15} color="#0C1C52" />
                    <Text style={local.menuText}>Edit Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={local.menuButton}
                    onPress={() => {
                      setMenuVisible(false);
                      router.push('./contacts')
                    }}
                  >
                    <Ionicons name="call-outline" size={15} color="#0C1C52" />
                    <Text style={local.menuText}>Contacts</Text>
                  </TouchableOpacity>

                    {/* ✅ Logout */}
                    <TouchableOpacity style={local.menuButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={16} color="#0C1C52" />
                        <Text style={local.menuText}>Logout</Text>
                    </TouchableOpacity>

                  <TouchableOpacity
                    style={local.closeCircle}
                    onPress={() => setMenuVisible(false)}
                  >
                    <Ionicons name="close" size={25} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={local.reopenButton}
              onPress={() => setMenuVisible(true)}
            >
              {avatar ? (
                <Image source={avatar} style={local.reopenAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={35} color="#fff" />
              )}
            </TouchableOpacity>
          )}

          {/* Recent Feedbacks */}
          <Text style={styles.sectionTitle}>Recent Feedbacks</Text>

          {feedbacks.length === 0 ? (
            <Text style={styles.noFeedbackText}>No feedbacks yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10, marginBottom: 30 }}
            >
              {feedbacks.map((f, index) => (
                <View key={index} style={styles.feedbackCard}>
                  <Text style={styles.feedbackIndex}>#{index + 1}</Text>
                  <Text style={styles.feedbackText}>User Type: {f.userType}</Text>
                  <Text style={[styles.feedbackText, { fontWeight: "600", color: "#007AFF" }]}>
                    Category: {f.category}
                  </Text>
                  <Text style={styles.feedbackText}>Emoji: {f.emoji}</Text>
                  <Text style={styles.feedbackText}>Message: {f.feedback}</Text>
                  <Text style={styles.feedbackDate}>Date: {f.date}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Chart */}
          <View style={styles.chartRow}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <PieChart
                data={chartData}
                width={screenWidth * 0.5}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  strokeWidth: 2,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="50"
                hasLegend={false}
              />
            </View>

            <View style={{ flex: 1, paddingLeft: 20 }}>
  <Text style={styles.topCategory}>Top Categories</Text>

  {categories.map((cat, index) => (
    <TouchableOpacity
      key={index}
      style={styles.categoryRow}
      //onPress={() => {
        // cat is coming from string[], so we cast to our known keys
        //const route = TOP_CATEGORY_ROUTES[cat as Category] ?? TOP_CATEGORY_ROUTES.Others;
        //router.push(route);
      //}}
      onPress={() => router.push(`./topCategories/${cat}`)}

    >
      <View style={[styles.dot, { backgroundColor: pieColors[index] }]} />
      <Text style={styles.categoryText}>
        {index + 1}. {cat} ({categoryPercentages[index]}%)
      </Text>
    </TouchableOpacity>
  ))}
</View>


          </View>

          {/* Legend */}
          <View style={styles.bottomLegend}>
            {categories.map((cat, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: pieColors[index] }]} />
                <Text style={{ fontSize: 15 }}>{cat}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,backgroundColor: "#c8d2ea",},

  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 10 },

  noFeedbackText: { fontStyle: "italic", color: "#888", marginLeft: 10 },

  feedbackCard: {
    marginRight: 14,
    width: 240,
    padding: 25,
    borderRadius: 15,
    backgroundColor: "#F7F9FC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  feedbackIndex: { fontWeight: "bold", marginBottom: 5, color: "#555" },

  feedbackText: { fontSize: 14, color: "#333" },

  feedbackDate: { fontSize: 12, color: "#888" },

  chartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  topCategory: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },

  categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },

  categoryText: { fontSize: 16, fontWeight: "500" },

  

  bottomLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 30,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 8,
  },

  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  dot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginRight: 10,
},
});

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e7f1fb", alignItems: "center", paddingTop: 40 },

  menuWrapper: { position: "absolute", top: 40, right: 0, zIndex: 20, alignItems: "flex-end" },
  halfRoundBlurContainer: {
    width: 200,
    height: 300,
    borderTopLeftRadius: 260,
    borderBottomLeftRadius: 260,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },

  menuAvatar: { width: 50, height: 50, borderRadius: 20, borderWidth: 2, borderColor: "#fff", marginBottom: 10 },
  menuItems: { alignItems: "center" },

  menuButton: {
    backgroundColor: "#E9DDF9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  menuText: { color: "#0C1C52", fontWeight: "500" },
  closeCircle: { backgroundColor: "#0C1C52", borderRadius: 20, padding: 6, marginTop: 8 },

  reopenButton: { position: "absolute", top: 60, right: 20, backgroundColor: "#0C1C52", borderRadius: 30, padding: 4, zIndex: 20 },
  reopenAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#fff" },

  content: { width: "90%", marginTop: 160 },
  folderTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  folderGrid: { width: "100%", alignItems: "center" },

  folderButton: {
    width: "90%",
    backgroundColor: "#fff",
    paddingVertical: 25,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  folderText: { fontSize: 18, fontWeight: "bold", color: "#0C1C52" },
  noFoldersText: { color: "#555", textAlign: "center", marginVertical: 20 },

  newFolderButton: { backgroundColor: "#0C1C52", width: "60%", alignItems: "center", paddingVertical: 12, borderRadius: 10, marginTop: 30 },
  newFolderText: { color: "#fff", fontWeight: "600" },

  folderEmojiBadge: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 5,
  },

  folderEmoji: { fontSize: 20 },
});