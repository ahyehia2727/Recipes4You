import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Button, Alert,TouchableOpacity,Text,Image } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore
import { loginWithEmail } from './firebaseadmin';
import { useNavigation } from '@react-navigation/native';
import { auth } from './firebaseconfig'; // Make sure you import your Firebase auth instance

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const db = getFirestore(); // Initialize Firestore

  const handleEmailSignIn = async () => {
    try {
      const user = await loginWithEmail(email, password);
      if (user.emailVerified) {
        // Check if the user has completed onboarding
        const docRef = doc(db, 'completedonboarding', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().completedOnboarding) {
          // User has completed onboarding, navigate to 'tabs'
          navigation.replace('Recipes4You');
        } else {
          // User has not completed onboarding, navigate to 'onboarding1'
          navigation.replace('Enter Your Allergies', {type:'signin'} );
        }
      } else {
        Alert.alert("Verify Email", "Please verify your email before logging in.");
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.logoContainer}>
        <Image
          source={require('./logo.png')} // Replace with the path to your logo image file
          style={styles.logo}
        />
      </View>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#A9A9A9"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#A9A9A9"
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleEmailSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.textButton} onPress={() => navigation.navigate('Sign Up')}>
        <Text style={styles.textButtonText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.textButton} onPress={() => navigation.navigate('Password Reset')}>
        <Text style={styles.textButtonText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items to the top
    paddingTop: 50, // Increase padding at the top to push content down (or reduce to push up)
    paddingHorizontal: 20, // Keep your horizontal padding as is
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 200, // Adjust the size according to your logo's aspect ratio
    height: 200, // Adjust the size according to your logo's aspect ratio
    resizeMode: 'contain', // This ensures your logo scales nicely within the given dimensions
  },
  input: {
    height: 50,
    borderColor: 'green', // Or use the specific hex code for green from your logo
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 25,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: 'green', // Or use the specific hex code for green from your logo
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  textButtonText: {
    color: 'green', // Or use the specific hex code for green from your logo
    fontSize: 16,
  },
});