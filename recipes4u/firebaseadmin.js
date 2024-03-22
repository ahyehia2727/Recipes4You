import { auth } from './firebaseconfig';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
  } from 'firebase/auth';

export const registerWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send email verification
    await sendEmailVerification(userCredential.user);
    console.log('Verification email sent.');
    return userCredential.user;
  } catch (error) {
    console.error('Error in registerWithEmail:', error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Can be used to check if the email is verified
    // if (!userCredential.user.emailVerified) { ... }
    console.log('User logged in:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error in loginWithEmail:', error);
    throw error;
  }
};
