import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { Header } from "../components/Layout";
import { auth } from "../database/config";
import { createFolder, listFolders } from "../services/folderService";

const COLORS = [
  "#c62828","#ef5350","#8e24aa","#5e35b1",
  "#283593","#0277bd","#00897b",
  "#7cb342","#fb8c00",
  "#6d4c41","#78909c","#37474f","#000000",
  "#ffffff","#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF",
  "#E0BBE4","#FFB7CE","#BFFCC6","#C9FFE5","#D4F0FF",
  "#FFF0BA","#FFD1DC","#D6EAF8","#F3E5F5",
];

export default function NewFolder() {
  const router = useRouter();

  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [folderCount, setFolderCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const folders = await listFolders(uid);
      setFolderCount(folders.length);
    };
    loadCount();
  }, []);

  const handleCreate = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Please login again.");

    if (!folderName.trim()) return alert("Project name is required!");

    const folders = await listFolders(uid);
    if (folders.length >= 5) return alert("You can only create 5 projects.");

    const folderId = await createFolder(uid, {
      name: folderName.trim(),
      description: description.trim(),
      color: selectedColor || "#0c1c37",
      icon: icon || null,
    });

    router.replace({ pathname: "/folder", params: { folderId } });
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="New Project" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.emptyHeader} />

        <Text style={styles.label}>Project Name</Text>
        <TextInput
          style={[styles.input, { color: "#000" }]}
          placeholder="Project name"
          placeholderTextColor="#888"
          value={folderName}
          onChangeText={setFolderName}
        />

        <Text style={styles.label}>Appearance</Text>
        <View style={styles.colorGridContainer}>
          {COLORS.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.colorBox, selectedColor === color && styles.selectedColorBox]}
              onPress={() => setSelectedColor(color)}
            >
              <View style={[styles.colorCircle, { backgroundColor: color }]} />
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

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.note}>You can only create 5 projects.</Text>

        <TouchableOpacity
          style={[styles.createButton, folderCount >= 5 && { backgroundColor: "#888" }]}
          onPress={handleCreate}
          disabled={folderCount >= 5}
        >
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>

        <Modal visible={showEmojiPicker} animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setIcon(emoji);
              setShowEmojiPicker(false);
            }}
            showSearchBar
            showTabs
            showHistory={false} // ✅ prevents AsyncStorage crash inside library
            columns={10}
          />
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#c8d2ea", minHeight: "100%" },
  emptyHeader: { height: 60 },
  label: { marginTop: 20, marginBottom: 6, fontSize: 14, fontWeight: "500" },

  input: { backgroundColor: "#fff", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#cdd6e1" },

  colorGridContainer: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 15 },
  colorBox: { width: "13%", aspectRatio: 1, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  selectedColorBox: { borderWidth: 2, borderColor: "#0c1c37" },
  colorCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "#000" },

  row: { flexDirection: "row", justifyContent: "space-between" },
  link: { color: "#005bb5", fontSize: 14 },

  textArea: { backgroundColor: "#fff", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#cdd6e1", height: 100 },

  note: { textAlign: "center", color: "#6d6d6d", fontSize: 12, marginVertical: 15 },

  createButton: { backgroundColor: "#0c1c37", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  createText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
