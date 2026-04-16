// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//     Alert,
//     KeyboardAvoidingView,
//     Modal,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { Header } from '../components/Layout';

// export default function EditProfile() {
//     const router = useRouter();
//   const [username, setUsername] = useState("");
//   const [userType, setUserType] = useState<'Internal' | 'External' | null>(null); //fixed
//   const [email, setEmail] = useState("");
//   const [avatar, setAvatar] = useState<{ uri: string } | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   // First app launch: clear old AsyncStorage
//   useEffect(() => {
//     const clearOldDataOnFirstLaunch = async () => {
//       try {
//         const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
//         if (!isFirstLaunch) {
//           // Clear saved profile data
//           await AsyncStorage.removeItem("username");
//           await AsyncStorage.removeItem("email");
//           await AsyncStorage.removeItem("userType");
//           await AsyncStorage.removeItem("avatar");
//           // Mark as launched
//           await AsyncStorage.setItem("isFirstLaunch", "true");
//         }
//       } catch (error) {
//         console.log("Error clearing old data:", error);
//       }
//     };

//     clearOldDataOnFirstLaunch();
//   }, []);

//   // Load saved profile
//   useEffect(() => {
//     const loadProfile = async () => {
//       try {
//         const savedUsername = await AsyncStorage.getItem("username");
//         const savedEmail = await AsyncStorage.getItem("email");
//         const savedUserType = await AsyncStorage.getItem("userType");
//         const savedAvatar = await AsyncStorage.getItem("avatar");

//         if (savedUsername) setUsername(savedUsername);
//         if (savedEmail) setEmail(savedEmail);
//         if (savedUserType === "Internal" || savedUserType === "External") {
//         setUserType(savedUserType);
//         } else {
//         setUserType(null);
//         }
//         if (savedAvatar) setAvatar({ uri: savedAvatar });
//       } catch (error) {
//         console.log("Error loading profile:", error);
//       }
//     };
//     loadProfile();
//   }, []);

//   const handleSave = async () => {
//     if (!username.trim() || !email.trim() || !userType) {
//       Alert.alert("Error", "Please fill all fields!");
//       return;
//     }

//     try {
//       await AsyncStorage.setItem("username", username.trim());
//       await AsyncStorage.setItem("email", email.trim());
//       await AsyncStorage.setItem("userType", userType);
//       if (avatar?.uri) await AsyncStorage.setItem("avatar", avatar.uri);
//       else await AsyncStorage.removeItem("avatar");

//       Alert.alert("Saved!", "Your profile has been updated successfully.");
//     } catch (error) {
//       Alert.alert("Error", "Something went wrong while saving.");
//       console.log(error);
//     }
//   };

//   const pickImageFromGallery = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert("Permission Denied", "Allow gallery access to choose a photo.");
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.8,
//     });
//     if (!result.canceled) setAvatar({ uri: result.assets[0].uri });
//     setModalVisible(false);
//   };

//   const takePhoto = async () => {
//     const permission = await ImagePicker.requestCameraPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert("Permission Denied", "Allow camera access to take a photo.");
//       return;
//     }
//     const result = await ImagePicker.launchCameraAsync({
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.8,
//     });
//     if (!result.canceled) setAvatar({ uri: result.assets[0].uri });
//     setModalVisible(false);
//   };

//   const removeAvatar = async () => {
//     setAvatar(null);
//     await AsyncStorage.removeItem("avatar");
//     setModalVisible(false);
//   };

//   return (
//     <View style={{ flex: 1 }}>
//     <Header
//       title="Edit Profile"
//       onBack={() => router.back()}
//     />

//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.headerSpace} />

//         <View style={styles.avatarContainer}>
//           {avatar ? (
//             <Image source={avatar} style={styles.avatar} />
//           ) : (
//             <View style={styles.emptyAvatar}>
//               <Ionicons name="person-outline" size={50} color="#aaa" />
//             </View>
//           )}
//           <TouchableOpacity
//             style={styles.addIcon}
//             onPress={() => setModalVisible(true)}
//           >
//             <Ionicons name="add" size={22} color="black" />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.inputRow}>
//           <Text style={styles.label}>Username :</Text>
//           <TextInput
//             style={styles.input}
//             value={username}
//             onChangeText={setUsername}
//             placeholder="Enter username"
//           />
//         </View>

//         <View style={styles.inputRow}>
//           <Text style={styles.label}>Email :</Text>
//           <TextInput
//             style={styles.input}
//             value={email}
//             onChangeText={setEmail}
//             keyboardType="email-address"
//             placeholder="Enter email"
//           />
//         </View>

//         <View style={styles.inputRow}>
//           <Text style={styles.label}>User type :</Text>
//           <View>
//             <TouchableOpacity
//               style={styles.radioRow}
//               onPress={() => setUserType("Internal")}
//             >
//               <View
//                 style={[
//                   styles.radioCircle,
//                   userType === "Internal" && styles.radioSelected,
//                 ]}
//               />
//               <Text>Internal</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.radioRow}
//               onPress={() => setUserType("External")}
//             >
//               <View
//                 style={[
//                   styles.radioCircle,
//                   userType === "External" && styles.radioSelected,
//                 ]}
//               />
//               <Text>External</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//           <Text style={styles.saveText}>Save</Text>
//         </TouchableOpacity>

//         <Modal
//           visible={modalVisible}
//           animationType="slide"
//           transparent
//           onRequestClose={() => setModalVisible(false)}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.bottomSheet}>
//               <View style={styles.handleBar} />
//               <Text style={styles.modalTitle}>Profile photo</Text>

//               <TouchableOpacity style={styles.optionRow} onPress={takePhoto}>
//                 <Text style={styles.optionEmoji}>📸</Text>
//                 <Text style={styles.optionLabel}>Camera</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.optionRow}
//                 onPress={pickImageFromGallery}
//               >
//                 <Text style={styles.optionEmoji}>🖼️</Text>
//                 <Text style={styles.optionLabel}>Gallery</Text>
//               </TouchableOpacity>

//               <TouchableOpacity style={styles.optionRow} onPress={removeAvatar}>
//                 <Text style={styles.optionEmoji}>❌</Text>
//                 <Text style={styles.optionLabel}>Remove photo</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.optionRow, { justifyContent: "center" }]}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text
//                   style={[styles.optionLabel, { color: "#007AFF", fontWeight: "600" }]}
//                 >
//                   Cancel
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>
//       </ScrollView>
//     </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#e7f1fb",
//   },
//   scrollContent: {
//     alignItems: "center",
//     paddingVertical: 30,
//   },
//   headerSpace: {
//     height: 60,
//   },
//   avatarContainer: {
//     alignItems: "center",
//     marginBottom: 20,
//     position: "relative",
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//   },
//   emptyAvatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: "#e0e0e0",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   addIcon: {
//     position: "absolute",
//     bottom: 0,
//     right: 0,
//     backgroundColor: "white",
//     borderRadius: 15,
//     padding: 3,
//     borderWidth: 1,
//     borderColor: "#ccc",
//   },
//   inputRow: {
//     width: "85%",
//     marginVertical: 10,
//   },
//   label: {
//     fontWeight: "bold",
//     marginBottom: 5,
//     fontSize: 15,
//   },
//   input: {
//     backgroundColor: "#fff",
//     padding: 10,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     fontSize: 15,
//   },
//   radioRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 5,
//   },
//   radioCircle: {
//     height: 18,
//     width: 18,
//     borderRadius: 9,
//     borderWidth: 2,
//     borderColor: "#777",
//     marginRight: 8,
//   },
//   radioSelected: {
//     backgroundColor: "#001F4D",
//   },
//   saveButton: {
//     backgroundColor: "#001F4D",
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     marginTop: 30,
//   },
//   saveText: {
//     color: "white",
//     fontWeight: "bold",
//     textAlign: "center",
//     fontSize: 16,
//   },

//   // WhatsApp-style bottom sheet
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.4)",
//     justifyContent: "flex-end",
//   },
//   bottomSheet: {
//     backgroundColor: "#fff",
//     width: "100%",
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     paddingVertical: 20,
//     paddingHorizontal: 25,
//   },
//   handleBar: {
//     width: 40,
//     height: 4,
//     backgroundColor: "#ccc",
//     borderRadius: 2,
//     alignSelf: "center",
//     marginBottom: 15,
//   },
//   modalTitle: {
//     fontSize: 17,
//     fontWeight: "600",
//     textAlign: "center",
//     marginBottom: 10,
//   },
//   optionRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   optionEmoji: {
//     fontSize: 22,
//     marginRight: 12,
//   },
//   optionLabel: {
//     fontSize: 16,
//     color: "#333",
//   },
// });

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Header } from "../components/Layout";
import { auth } from "../database/config";
import { getUserProfile, getUserRole, updateUserProfile, uploadUserAvatar } from "../services/userService";

export default function EditProfile() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState<"Internal" | "External" | null>(null);
  const [role, setRole] = useState<"admin" | "community" | null>(null);
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<{ uri: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace("/login");
          return;
        }

        const profile = await getUserProfile(uid);
        const r = await getUserRole(uid);

        setUsername(profile.username ?? "");
        setUserType(profile.userType ?? null);
        setEmail(profile.email ?? "");
        setAvatar(profile.photoURL ? { uri: profile.photoURL } : null);
        setRole(r);
    } catch (e) {
        console.log("load profile error:", e);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // role must be in state, e.g. const [role, setRole] = useState<'admin' | 'community' | null>(null);
  const isAdmin = role === "admin";

  // ✅ validation
  if (!username.trim()) {
    Alert.alert("Error", "Please fill username!");
    return;
  }

  // community must pick userType, admin doesn't
  if (!isAdmin && !userType) {
    Alert.alert("Error", "Please select user type!");
    return;
  }

  try {
    setSaving(true);

    const payload: any = {
      username: username.trim(),
      // photoURL is saved separately when you upload avatar (storage)
    };

    // ✅ only save userType for community
    if (!isAdmin) payload.userType = userType;

    await updateUserProfile(uid, payload);

    Alert.alert("Saved!", "Your profile has been updated successfully.");
  } catch (e) {
    console.log("save profile error:", e);
    Alert.alert("Error", "Something went wrong while saving.");
  } finally {
    setSaving(false);
  }
};


  const pickImageFromGallery = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Allow gallery access to choose a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setSaving(true);
        const localUri = result.assets[0].uri;
        const url = await uploadUserAvatar(uid, localUri);
        setAvatar({ uri: url });
      } catch (e) {
        console.log("upload avatar error:", e);
        Alert.alert("Error", "Failed to upload photo.");
      } finally {
        setSaving(false);
      }
    }

    setModalVisible(false);
  };

  const takePhoto = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Allow camera access to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setSaving(true);
        const localUri = result.assets[0].uri;
        const url = await uploadUserAvatar(uid, localUri);
        setAvatar({ uri: url });
      } catch (e) {
        console.log("upload avatar error:", e);
        Alert.alert("Error", "Failed to upload photo.");
      } finally {
        setSaving(false);
      }
    }

    setModalVisible(false);
  };

  const removeAvatar = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      setSaving(true);
      await updateUserProfile(uid, { photoURL: null });
      setAvatar(null);
    } catch (e) {
      console.log("remove avatar error:", e);
      Alert.alert("Error", "Failed to remove photo.");
    } finally {
      setSaving(false);
      setModalVisible(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Edit Profile" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSpace} />

          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={avatar} style={styles.avatar} />
            ) : (
              <View style={styles.emptyAvatar}>
                <Ionicons name="person-outline" size={50} color="#aaa" />
              </View>
            )}
            <TouchableOpacity style={styles.addIcon} onPress={() => setModalVisible(true)} disabled={saving}>
              <Ionicons name="add" size={22} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Username :</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Enter username" />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Email :</Text>
            <TextInput style={[styles.input, { backgroundColor: "#f1f5f9" }]} value={email} editable={false} />
          </View>

          {role !== "admin" && (
          <View style={styles.inputRow}>
            <Text style={styles.label}>User type :</Text>
            <View>
              <TouchableOpacity style={styles.radioRow} onPress={() => setUserType("Internal")}>
                <View style={[styles.radioCircle, userType === "Internal" && styles.radioSelected]} />
                <Text>Internal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioRow} onPress={() => setUserType("External")}>
                <View style={[styles.radioCircle, userType === "External" && styles.radioSelected]} />
                <Text>External</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.bottomSheet}>
                <View style={styles.handleBar} />
                <Text style={styles.modalTitle}>Profile photo</Text>

                <TouchableOpacity style={styles.optionRow} onPress={takePhoto}>
                  <Text style={styles.optionEmoji}>📸</Text>
                  <Text style={styles.optionLabel}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={pickImageFromGallery}>
                  <Text style={styles.optionEmoji}>🖼️</Text>
                  <Text style={styles.optionLabel}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={removeAvatar}>
                  <Text style={styles.optionEmoji}>❌</Text>
                  <Text style={styles.optionLabel}>Remove photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.optionRow, { justifyContent: "center" }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.optionLabel, { color: "#007AFF", fontWeight: "600" }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#c8d2ea" },
  scrollContent: { alignItems: "center", paddingVertical: 30 },
  headerSpace: { height: 60 },

  avatarContainer: { alignItems: "center", marginBottom: 20, position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  emptyAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center" },
  addIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "white", borderRadius: 15, padding: 3, borderWidth: 1, borderColor: "#ccc" },

  inputRow: { width: "85%", marginVertical: 10 },
  label: { fontWeight: "bold", marginBottom: 5, fontSize: 15 },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", fontSize: 15 },

  radioRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  radioCircle: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: "#777", marginRight: 8 },
  radioSelected: { backgroundColor: "#001F4D" },

  saveButton: { backgroundColor: "#001F4D", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 30, marginTop: 30 },
  saveText: { color: "white", fontWeight: "bold", textAlign: "center", fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { backgroundColor: "#fff", width: "100%", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: 20, paddingHorizontal: 25 },
  handleBar: { width: 40, height: 4, backgroundColor: "#ccc", borderRadius: 2, alignSelf: "center", marginBottom: 15 },
  modalTitle: { fontSize: 17, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  optionEmoji: { fontSize: 22, marginRight: 12 },
  optionLabel: { fontSize: 16, color: "#333" },
});
