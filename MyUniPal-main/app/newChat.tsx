import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { Header } from "../components/Layout";
import { auth } from "../database/config";
import { createSession, getFolder, listSessions } from "../services/folderService";

const MAX_SESSIONS = 5;

const COLORS = [
  "#c62828","#ef5350","#8e24aa","#5e35b1",
  "#283593","#0277bd","#00897b",
  "#7cb342","#fb8c00",
  "#6d4c41","#78909c","#37474f","#000000",
  "#ffffff","#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF","#E0BBE4",
  "#FFB7CE","#BFFCC6","#C9FFE5","#D4F0FF","#FFF0BA","#FFD1DC","#D6EAF8","#F3E5F5",
];

export default function NewChat() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const safeFolderId = useMemo(() => String(folderId ?? ""), [folderId]);

  const [folderName, setFolderName] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !safeFolderId) return;

      const folder = await getFolder(uid, safeFolderId);
      setFolderName(folder?.name ?? "");

      const s = await listSessions(uid, safeFolderId);
      setSessionCount(s.length);
    };

    load();
  }, [safeFolderId]);

  const handleCreate = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return Alert.alert("Error", "Please login again.");
    if (!safeFolderId) return Alert.alert("Error", "Folder not found.");

    if (!sessionTitle.trim()) return Alert.alert("Invalid Input", "Please enter a session name.");

    if (sessionCount >= MAX_SESSIONS) {
      return Alert.alert("Limit Reached", "You can only create 5 sessions per project.");
    }

    try {
      await createSession(uid, safeFolderId, {
        title: sessionTitle.trim(),
        color: selectedColor || "#d9d9d9",
        icon: icon || null,
      });

      router.replace({ pathname: "/folder", params: { folderId: safeFolderId } });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to create session.");
    }
  };

  const disableCreate = sessionCount >= MAX_SESSIONS;

  return (
    <View style={{ flex: 1, backgroundColor: "#e7f1fb" }}>
      <Header title="NewChat" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Project Name</Text>
        <TextInput style={styles.input} value={folderName} editable={false} />

        <Text style={styles.label}>Chat Session Name</Text>
        <TextInput
          style={styles.input}
          placeholder="New session"
          placeholderTextColor="#888"
          value={sessionTitle}
          onChangeText={setSessionTitle}
        />

        <Text style={styles.label}>Appearance</Text>
        <View style={styles.colorGridContainer}>
          {COLORS.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.colorBox, selectedColor === c && styles.selectedColorBox]}
              onPress={() => setSelectedColor(c)}
              activeOpacity={0.8}
            >
              <View style={[styles.colorCircle, { backgroundColor: c }]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.link} onPress={() => setShowEmojiPicker(true)}>
            Add Icon
          </Text>
          <Text style={styles.link} onPress={() => setIcon(null)}>
            Remove Icon
          </Text>
        </View>

        <Text style={styles.note}>You can only create 5 sessions per project.</Text>

        <TouchableOpacity
          style={[styles.createButton, disableCreate && { backgroundColor: "#888" }]}
          onPress={handleCreate}
          disabled={disableCreate}
        >
          <Text style={styles.createText}>{disableCreate ? "Max 5 sessions" : "Create"}</Text>
        </TouchableOpacity>

        <Modal visible={showEmojiPicker} animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setIcon(emoji);
              setShowEmojiPicker(false);
            }}
            showSearchBar
            showTabs
            showHistory={false} // ✅ avoid AsyncStorage crash
            columns={10}
          />
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20,paddingBottom: 40 ,backgroundColor: "#c8d2ea",minHeight: "100%" },

  label: { marginTop: 20, marginBottom: 6, fontSize: 14, fontWeight: "600", color: "#0c1c37" },

  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#cdd6e1",
    color: "#000",
  },

  colorGridContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#cdd6e1",
  },

  colorBox: { width: "13%", aspectRatio: 1, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  selectedColorBox: { borderWidth: 2, borderColor: "#0c1c37" },
  colorCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "#000" },

  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  link: { color: "#005bb5", fontSize: 14, fontWeight: "600" },

  note: { textAlign: "center", color: "#6d6d6d", fontSize: 12, marginVertical: 15 },

  createButton: { backgroundColor: "#0c1c37", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  createText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
