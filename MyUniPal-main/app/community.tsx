import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Header } from "../components/Layout";
import { auth } from "../database/config";
import { deleteFolder, listFolders } from "../services/folderService";
import { getUserProfile, getUserRole } from "../services/userService";

type FolderItem = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string | null;
};

export default function CommunityDashboard() {
  const router = useRouter();
  const isFocused = useIsFocused();

  const [checkingRole, setCheckingRole] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatar, setAvatar] = useState<{ uri: string } | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const openedOnceRef = useRef(false);

  // ✅ open menu only once (first time component mounts)
  useEffect(() => {
    if (!openedOnceRef.current) {
      setMenuVisible(true);
      openedOnceRef.current = true;
    }
  }, []);

  useEffect(() => {
    const checkCommunityAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      const role = await getUserRole(user.uid);
      if (role !== "community") {
        router.replace("./admin");
        return;
      }

      setCheckingRole(false);
    };

    checkCommunityAccess();
  }, []);

  // avatar 
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
  // ✅ folders from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const data = await listFolders(uid);
        setFolders(data);
      } catch (e) {
        console.log("Error loading folders:", e);
      }
    };

    if (isFocused) load();
  }, [isFocused]);

  const handleDeleteFolder = (folder: FolderItem) => {
    Alert.alert("Delete Project", `Delete "${folder.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            await deleteFolder(uid, folder.id);
            setFolders((prev) => prev.filter((f) => f.id !== folder.id));
          } catch (e) {
            console.log("Error deleting folder:", e);
            Alert.alert("Error", "Failed to delete project.");
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (e) {
      console.log("logout error:", e);
      Alert.alert("Error", "Failed to logout.");
    }
  };

  if (checkingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title="Community Dashboard" onBack={() => router.back()} />

      <View style={styles.container}>
        {/* Menu */}
        {menuVisible ? (
          <View style={styles.menuWrapper}>
            <View style={styles.halfRoundBlurContainer}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

              {avatar ? (
                <Image source={avatar} style={styles.menuAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={50} color="#ccc" />
              )}

              <View style={styles.menuItems}>
                <TouchableOpacity style={styles.menuButton} onPress={() => router.push("./editProfile")}>
                  <Ionicons name="person-outline" size={16} color="#0C1C52" />
                  <Text style={styles.menuText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => router.push("./gpaCalc")}>
                  <Ionicons name="calculator-outline" size={16} color="#0C1C52" />
                  <Text style={styles.menuText}>GPA Calculator</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => router.push("./feedback")}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0C1C52" />
                  <Text style={styles.menuText}>Feedback</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => router.push("./contacts")}>
                  <Ionicons name="call-outline" size={16} color="#0C1C52" />
                  <Text style={styles.menuText}>Contacts</Text>
                </TouchableOpacity>

                {/* ✅ Logout */}
                <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color="#0C1C52" />
                  <Text style={styles.menuText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeCircle} onPress={() => setMenuVisible(false)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.reopenButton} onPress={() => setMenuVisible(true)}>
            {avatar ? (
              <Image source={avatar} style={styles.reopenAvatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={36} color="#fff" />
            )}
          </TouchableOpacity>
        )}

        {/* Folder list */}
        <View style={styles.content}>
          <Text style={styles.folderTitle}>Projects</Text>

          <View style={styles.folderGrid}>
            {folders.length === 0 ? (
              <Text style={styles.noFoldersText}>No Projects yet. Tap “New Project” to create one.</Text>
            ) : (
              folders.map((folder, index) => (
                <TouchableOpacity
                  key={folder.id ?? index}
                  style={[styles.folderButton, { borderColor: folder.color || "#0C1C52" }]}
                  onPress={() => router.push({ pathname: "./folder", params: { folderId: folder.id } })}
                  onLongPress={() => handleDeleteFolder(folder)}
                >
                  {folder.icon && (
                    <View style={[styles.folderEmojiBadge, { backgroundColor: folder.color || "#0C1C52" }]}>
                      <Text style={styles.folderEmoji}>{folder.icon}</Text>
                    </View>
                  )}

                  <Text style={[styles.folderText, { color: folder.color || "#0C1C52" }]}>{folder.name}</Text>
                </TouchableOpacity>
              ))
            )}

            {folders.length >= 5 && (
              <Text style={{ color: "red", marginTop: 10 }}>Maximum 5 Projects reached.</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.newFolderButton, folders.length >= 5 && { backgroundColor: "#888" }]}
          onPress={() => router.push("./newFolder")}
          disabled={folders.length >= 5}
        >
          <Text style={styles.newFolderText}>New Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#c8d2ea", alignItems: "center", paddingTop: 40 },

  menuWrapper: { position: "absolute", top: 40, right: 0, zIndex: 20, alignItems: "flex-end" },
  halfRoundBlurContainer: {
    width: 260,
    height: 340,
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
