import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header } from '../components/Layout';
import { auth } from '../database/config';
import { signIn, signUp } from '../services/authService';
import { useGoogleAuth } from '../services/googleAuth';
import { getUserRole } from '../services/userService';


export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }

  try {
    setLoading(true);

    if (isSignUp) {
      // ✅ Sign up -> always go role selection
      await signUp(email, password);
      router.replace('/role');
      return;
    }

    // ✅ Login -> check role and route
    await signIn(email, password);

    const user = auth.currentUser;
    if (!user) {
      alert('Login failed. Try again.');
      return;
    }

    const role = await getUserRole(user.uid);

    if (!role) {
      router.replace('/role'); // edge case (role not set)
    } else if (role === 'admin') {
      router.replace('./admin');
    } else {
      router.replace('./community');
    }
  } catch (err: any) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};


const { signInWithGoogle } = useGoogleAuth();


  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="MyUniPal" onBack={() => router.back()}/>

      <View style={styles.body}>
        <Text style={styles.title}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>Access your university companion</Text>
        
        <TextInput
          placeholder="name@vau.ac.lk"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primaryBtn} onPress={handleAuth}>
          <Text style={styles.primaryText}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </Text>
        </Pressable>

        <Pressable style={styles.googleBtn}
            onPress={async () => {
            try {
              await signInWithGoogle();
              router.replace('/role');
            } catch (e: any) {
              alert(e.message);
            }
             }}
        >
          <Ionicons
            name="logo-google"
            size={22}
            color="#000"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        <Pressable onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggle}>
            {isSignUp ? 'Already have an account? Login' : 'New to MyUniPal? SignUp'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 20,
    backgroundColor: '#c8d2ea',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 120,
    textAlign:'center',
  },
  subtitle: {
    color: '#64748b',
    marginBottom: 50,
    textAlign:'center',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  primaryText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  googleBtn: {
    marginTop: 16,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  googleText: {
    fontWeight: '600',
  },
  toggle: {
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
    color:'#64748b',
  },
});
