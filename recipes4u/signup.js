// SignUp.js
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, Alert,Image,TouchableOpacity,Text } from 'react-native';
import { registerWithEmail } from './firebaseadmin';
import { useNavigation } from '@react-navigation/native';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleEmailSignUp = async () => {
    try {
      const user = await registerWithEmail(email, password);
      if (user) {
        Alert.alert(
          "Verify Email",
          "A verification email has been sent. Please check your inbox.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert("Registration Error", error.message);
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
      <TouchableOpacity style={styles.button} onPress={handleEmailSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.textButton} onPress={() => navigation.navigate('Sign In')}>
        <Text style={styles.textButtonText}>Back to Sign in</Text>
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
    width: 150, // Adjust based on your logo
    height: 150, // Adjust based on your logo
    resizeMode: 'contain',
  },
  input: {
    height: 50,
    borderColor: 'green', // Your theme's green color
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 25,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: 'green', // Your theme's green color
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  textButtonText: {
    color: 'green', // Your theme's green color
    fontSize: 16,
  },
});