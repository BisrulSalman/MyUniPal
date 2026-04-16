import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../components/Layout";
import { app, auth, db } from "../database/config";
import { sendChatMessage } from "../services/chatService";

type Msg = {
  id: string;
  role: "user" | "myunipal";
  text: string;
  createdAt?: any;
  sources?: Array<{ faculty: string; doc: string; chunkIndex: number }>;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    folderId?: string;
    sessionId?: string;
    sessionTitle?: string;
  }>();

  const folderId = useMemo(() => String(params.folderId ?? ""), [params.folderId]);
  const sessionId = useMemo(() => String(params.sessionId ?? ""), [params.sessionId]);
  const title = useMemo(() => String(params.sessionTitle ?? "Chat"), [params.sessionTitle]);

  const uid = auth.currentUser?.uid;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [aiTyping, setAiTyping] = useState(false);
  const [showNewBtn, setShowNewBtn] = useState(false);

  const listRef = useRef<FlatList<Msg>>(null);

  const isNearBottomRef = useRef(true);
  const userJustSentRef = useRef(false);
  const prevCountRef = useRef(0);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false);

  const scrollToBottom = useCallback((animated = true) => {
    // Normal list => bottom is end
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  useEffect(() => {
    if (!uid || !folderId || !sessionId) return;

    const q = query(
      collection(db, "users", uid, "folders", folderId, "sessions", sessionId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Msg[];
      setMessages(arr);

      // typing indicator: last msg is user => AI likely generating next
      const last = arr[arr.length - 1];
      setAiTyping(last?.role === "user");

      const prev = prevCountRef.current;
      const next = arr.length;
      prevCountRef.current = next;
      const hasNew = next > prev;

      if (!hasNew) return;

      // ✅ Auto-scroll ONLY if:
      // - user is already near bottom, OR
      // - user just sent
      if (isNearBottomRef.current || userJustSentRef.current) {
        setShowNewBtn(false);
        userJustSentRef.current = false;
        scrollToBottom(true);
      } else {
        setShowNewBtn(true);
      }
    });

    return () => unsub();
  }, [uid, folderId, sessionId, scrollToBottom]);

  const onSend = useCallback(async () => {
    if (!uid || !folderId || !sessionId) return;

    const text = input.trim();
    if (!text) return;

    setInput("");
    setSending(true);

    // after sending, always go to bottom
    userJustSentRef.current = true;

    try {
      await sendChatMessage({ uid, folderId, sessionId, text });
      scrollToBottom(true);
    } catch (e) {
      console.log("send error:", e);
    } finally {
      setSending(false);
    }
  }, [uid, folderId, sessionId, input, scrollToBottom]);
const transcribe = useCallback(async (audioUri: string, mimeType: string) => {
  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: "base64",
  }as any);

  const functions = getFunctions(app, "us-central1");
  const fn = httpsCallable(functions, "transcribeAudio");

  const res = await fn({
    audioBase64: base64,
    mimeType,
    language: "en", // optional
  });

  const data = res.data as { text: string };
  return (data?.text ?? "").trim();
}, []);

  const onPressMic = useCallback(async () => {
  if (recordingBusy) return;
  setRecordingBusy(true);

  try {
    // If NOT recording -> start
    if (!recording) {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      setRecording(rec);
      return;
    }

    // If recording -> stop & transcribe
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (!uri) return;

    // most Expo iOS recordings end up m4a; Android may vary
    const mimeType = uri.endsWith(".wav") ? "audio/wav" : "audio/m4a";

    // Optional: show user feedback while transcribing
    const text = await transcribe(uri, mimeType);

    if (text) {
      // put text into input box (append if user already typed)
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    }
  } catch (e) {
    console.log("mic error:", e);
    setRecording(null);
  } finally {
    setRecordingBusy(false);
  }
}, [recording, recordingBusy, transcribe]);


  if (!uid || !folderId || !sessionId) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Chat" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={{ fontWeight: "700" }}>Missing project/session. Go back and open again.</Text>
        </View>
      </View>
    );
  }

  
  return (
    <View style={{ flex: 1 }}>
      <Header title={title} onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <SafeAreaView style={styles.container}>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => {
                // only autoscroll if user is near bottom OR just sent
                if (isNearBottomRef.current || userJustSentRef.current) {
                  scrollToBottom(false);
                }
              }}
              onScroll={(e) => {
                const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                const distanceFromBottom =
                  contentSize.height - (layoutMeasurement.height + contentOffset.y);

                const nearBottom = distanceFromBottom < 120; // tweak
                isNearBottomRef.current = nearBottom;

                if (nearBottom) setShowNewBtn(false);
              }}
              scrollEventThrottle={16}
              renderItem={({ item: m }) => (
                <View style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.bubbleText, m.role === "user" && { color: "#fff" }]}>
                    {m.text}
                  </Text>

                  {m.role === "myunipal" && Array.isArray(m.sources) && m.sources.length > 0 && (
                    <Text style={styles.sourcesText}>
                      From handbook:{" "}
                      {m.sources
                        .slice(0, 3)
                        .map((s) => `${s.faculty}/${s.doc}#${s.chunkIndex}`)
                        .join(" • ")}
                    </Text>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={{ color: "#444", fontWeight: "700" }}>
                    Ask something from the MyUniPal...
                  </Text>
                </View>
              }
              // ✅ typing indicator at the bottom
              ListFooterComponent={
                aiTyping ? (
                  <View style={[styles.bubble, styles.aiBubble, { opacity: 0.75 }]}>
                    <Text style={styles.bubbleText}>MyUniPal is typing…</Text>
                  </View>
                ) : (
                  <View style={{ height: 4 }} />
                )
              }
            />

            {showNewBtn && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.newMsgBtn}
                onPress={() => {
                  setShowNewBtn(false);
                  scrollToBottom(true);
                }}
              >
                <Ionicons name="arrow-down" size={16} color="#fff" />
                <Text style={styles.newMsgText}>New messages</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Input bar */}
          <View style={styles.inputRow}>
            <TouchableOpacity
  style={[styles.micBtn, (recordingBusy || sending) && { opacity: 0.6 }]}
  onPress={onPressMic}
  activeOpacity={0.8}
  disabled={recordingBusy || sending}
>
              <Ionicons name={recording ? "stop" : "mic"} size={18} color="#fff" />
            </TouchableOpacity>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message…"
              placeholderTextColor="#777"
              style={styles.input}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.6 }]}
              onPress={onSend}
              disabled={!input.trim() || sending}
            >
              {sending ? <ActivityIndicator /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#c8d2ea" },

  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    flexGrow: 1,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#0c1c37",
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#0c1c37" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#fff" },

  bubbleText: { color: "#000", fontSize: 15, fontWeight: "600" },
  sourcesText: { marginTop: 8, fontSize: 11, color: "#555", fontWeight: "700" },

  newMsgBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "#0c1c37",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#0c1c37",
  },
  newMsgText: { color: "#fff", fontWeight: "800" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#9aa8c0",
    backgroundColor: "#c8d2ea",
  },

  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0c1c37",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#9aa8c0",
    color: "#000",
    fontWeight: "600",
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0c1c37",
    alignItems: "center",
    justifyContent: "center",
  },
});