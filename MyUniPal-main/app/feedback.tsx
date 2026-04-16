import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { auth } from "../database/config";
import { addFeedback } from "../services/feedbackService";
import { getUserRole } from "../services/userService";

import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Layout';

export default function Feedback() {
  const router = useRouter();
  const [userType, setUserType] = useState('Internal');
  const [category, setCategory] = useState('Academic');
  const [emoji, setEmoji] = useState('');
  const [feedback, setFeedback] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const categories = ['Academic', 'MyUniPal', 'Library', 'Hostel', 'Others'];
  const emojis = ['😍', '😊', '😐', '😡'];

  // Animate emoji
  const handleEmojiSelect = (selectedEmoji : string) => {
    setEmoji(selectedEmoji);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  // Submit Feedback
  const handleSubmit = async () => {
  if (!emoji || !feedback.trim()) {
    Alert.alert("Missing Input", "Please select an emoji and enter your feedback!");
    return;
  }

  try {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Not logged in", "Please login again.");
      router.replace("/login");
      return;
    }

    const role = await getUserRole(uid); // so you can store who sent it (optional)

    await addFeedback({
      uid,
      role,
      userType,
      category,
      emoji,
      feedback: feedback.trim(),
    });

    // Reset
    setEmoji("");
    setFeedback("");
    setUserType("Internal");
    setCategory("Academic");

    Alert.alert("Success", "Feedback submitted successfully!", [
      { text: "OK", onPress: () => router.push("./admin") },
    ]);
  } catch (e) {
    console.log("Error sending feedback:", e);
    Alert.alert("Error", "Failed to send feedback. Please try again.");
  }
};


  return (
     <View style={{ flex: 1 }}>
    {/* Header with back button */}
    <Header
      title="Feedback Form"
      onBack={() => router.back()}
    />
    <SafeAreaView style={styles.container}>
       
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>

            {/* User Type */}
            <Text style={styles.label}>User Type</Text>
            <View style={[styles.radioRow, { justifyContent: 'space-evenly' }]}>
              {['Internal', 'External'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.radioButton, userType === type && styles.radioButtonActive]}
                  onPress={() => setUserType(type)}
                >
                  <Text style={[styles.radioText, userType === type && styles.radioTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={[styles.radioRow, { justifyContent: 'space-evenly', flexWrap: 'wrap' }]}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.radioButton, category === cat && styles.radioButtonActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.radioText, category === cat && styles.radioTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Emoji */}
            <Text style={styles.label}>How was your experience?</Text>
            <View style={[styles.emojiContainer, { justifyContent: 'space-evenly' }]}>
              {emojis.map((e) => (
                <TouchableOpacity key={e} onPress={() => handleEmojiSelect(e)}>
                  <Animated.Text
                    style={[
                      styles.emoji,
                      emoji === e && styles.selectedEmoji,
                      emoji === e && { transform: [{ scale: scaleAnim }] },
                    ]}
                  >
                    {e}
                  </Animated.Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Feedback */}
            <Text style={styles.label}>Your Feedback</Text>
            <TextInput
              style={styles.input}
              placeholder="Share your thoughts, suggestions, or issues..."
              placeholderTextColor="#9E9E9E"
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
    </SafeAreaView>
    </View>
  );
}

// --------------------------
//      STYLES
// --------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c8d2ea",
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  card: {
    flex: 1,
  },

  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#002B66",
    marginTop: 14,
    marginBottom: 8,
    marginLeft:15,
  },

  radioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  radioButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CFE4FF",
    backgroundColor: "#CFE4FF",
  },

  radioButtonActive: {
    backgroundColor: "#001F4D",
    borderColor: "#001F4D",
  },

  radioText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#002B66",
  },

  radioTextActive: {
    color: "#fff",
  },

  divider: {
    height: 1,
    backgroundColor: "#B0C4DE",
    marginVertical: 20,
  },

  emojiContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },

  emoji: {
    fontSize: 38,
    opacity: 0.6,
  },

  selectedEmoji: {
    opacity: 1,
  },

  input: {
    borderWidth: 1,
    borderColor: "#B0C4DE",
    borderRadius: 12,
    backgroundColor: "#F8FBFF",
    height: 120,
    textAlignVertical: "top",
    padding: 14,
    fontSize: 15,
    color: "#002B66",
    marginBottom: 20,
  },

  bottomButtonContainer: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
  },

  submitBtn: {
    backgroundColor: "#001F4D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});