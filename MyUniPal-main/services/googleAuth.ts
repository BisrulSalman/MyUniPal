import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../database/config';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'XXX.apps.googleusercontent.com', //enter your client id
  });

  const signInWithGoogle = async () => {
    const result = await promptAsync(); 

    if (result.type !== 'success') return;

    const { id_token } = result.params;

    const credential = GoogleAuthProvider.credential(id_token);
    const res = await signInWithCredential(auth, credential);

    const userRef = doc(db, 'users', res.user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        email: res.user.email,
        createdAt: new Date(),
      });
    }

    return res.user;
  };

  return { signInWithGoogle };
}