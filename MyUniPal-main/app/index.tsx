import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Header } from '../components/Layout';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#eff6ff' }}>
      <Header title="MyUniPal"/>

      <View style={styles.body}>
        <Text style={styles.welcome}>Welcome to MyUniPal!</Text>

        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.tagline}>
          Simplifying student life and admin decisions
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Let's Go!</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    backgroundColor: '#c8d2ea'
  },
  logo: {
    width: 188,
    height: 188,
    marginBottom: 24,
    
  },
  welcome: {
    color: '#64748b',
    fontSize: 22,
    fontWeight: '700',
    marginBottom:50,
  },
  tagline: {
    color: '#64748b',
    fontWeight:'700',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0A1B36',
    paddingHorizontal: 50,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
