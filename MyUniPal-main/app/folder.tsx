import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Header } from "../components/Layout";
import { auth } from "../database/config";
import { deleteSession, getFolder, listSessions } from "../services/folderService";

type Session = { id: string; title: string; color?: string; icon?: string | null; createdAt?: any };
type Folder = { id: string; name: string; color: string; icon?: string | null; description?: string };

const MAX_SESSIONS = 5;

export default function FolderScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid || !folderId) return;

      const f = await getFolder(uid, String(folderId));
      if (!f) {
        setFolder(null);
        setSessions([]);
        return;
      }

      setFolder({ id: f.id, name: f.name, color: f.color, icon: f.icon ?? null, description: f.description });
      const s = await listSessions(uid, String(folderId));
      setSessions(s.map((x) => ({ id: x.id, title: x.title, color: x.color, icon: x.icon ?? null })));
    } catch (e) {
      console.log("loadAll error:", e);
      setFolder(null);
      setSessions([]);
    }
  }, [folderId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onDeleteSession = (sessionId: string) => {
    if (!folderId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    Alert.alert("Delete Session?", "Are you sure you want to delete this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSession(uid, String(folderId), sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          } catch (e) {
            console.log("delete session error:", e);
            Alert.alert("Error", "Failed to delete session.");
          }
        },
      },
    ]);
  };

  if (!folder) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="MyUniPal" onBack={() => router.back()} />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>Folder not found</Text>
        </View>
      </View>
    );
  }

  const disableNewChat = sessions.length >= MAX_SESSIONS;

  return (
    <View style={{ flex: 1, backgroundColor: "#e7f1fb" }}>
      <Header title="MyUniPal" onBack={() => router.back()} />

      <View style={styles.container}>
        <View style={[styles.folderCard, { borderColor: folder.color }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.folderName}>{folder.name}</Text>
            <Text style={styles.folderCount}>Total sessions: {sessions.length}</Text>
          </View>

          <View style={styles.folderIconBubble}>
            {folder.icon ? (
              <Text style={{ fontSize: 22 }}>{folder.icon}</Text>
            ) : (
              <Ionicons name="folder-outline" size={22} color="#0c1c37" />
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sessions</Text>

        <FlatList
          data={sessions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 10 }}
          renderItem={({ item }) => {
            const bg = item.color || "#d9d9d9";
            return (
              <TouchableOpacity
                style={[styles.sessionCard, { backgroundColor: bg }]}
                onPress={() =>
                router.push({
                  pathname: "./chat",
                  params: {
                    folderId: String(folderId),
                    sessionId: item.id,
                    sessionTitle: item.title,
                  },
                })
              }
                onLongPress={() => onDeleteSession(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.sessionTopRow}>
                  <Text style={styles.sessionTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.sessionIconMini}>
                    {item.icon ? (
                      <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    ) : (
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0c1c37" />
                    )}
                  </View>
                </View>

                <View>
                  {/* if you want dates again we can add them from createdAt later */}
                  <Text style={styles.sessionMeta}>Long-press to delete</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.newChatBtn, disableNewChat && { backgroundColor: "#8a8a8a" }]}
          disabled={disableNewChat}
          onPress={() => router.push({ pathname: "/newChat", params: { folderId: folder.id } })}
        >
          <Text style={styles.newChatText}>{disableNewChat ? "Max 5 sessions reached" : "NewChat"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: "#c8d2ea"},

  folderCard: {
    marginHorizontal: 22,
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#d9d9d9",
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
  },

  folderName: { fontSize: 20, fontWeight: "800", color: "#0c1c37" },
  folderCount: { marginTop: 6, fontSize: 13, fontWeight: "600", color: "#0c1c37" },

  folderIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#0c1c37",
  },

  // ✅ extra spacing already here
  sectionTitle: { marginTop: 26, marginBottom: 16, marginLeft: 22, fontSize: 20, fontWeight: "900", color: "#0c1c37" },

  sessionCard: {
    width: 140,
    height: 150,
    borderRadius: 14,
    padding: 12,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#0c1c37",
    justifyContent: "space-between",
  },

  sessionTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  sessionTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: "#0c1c37" },

  sessionIconMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0c1c37",
  },

  sessionMeta: { fontSize: 12, fontWeight: "700", color: "#0c1c37", marginTop: 4 },

  newChatBtn: {
    marginTop: 24,
    marginHorizontal: 70,
    backgroundColor: "#0c1c37",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 40 : 24,
  },

  newChatText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  notFoundWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16, fontWeight: "700", color: "#0c1c37" },
});
