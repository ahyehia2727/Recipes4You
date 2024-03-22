import * as React from 'react';
import { StyleSheet, View, TextInput, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { auth } from './firebaseconfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const PasswordReset = () => {
  const [email, setEmail] = React.useState('');
  const navigation = useNavigation();

  const handlePasswordReset = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Check your email', 'A link to reset your password has been sent to your email address.');
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
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
        placeholder="Enter your email"
        placeholderTextColor="#A9A9A9"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Send Password Reset Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.textButton} onPress={() => navigation.navigate('Sign In')}>
        <Text style={styles.textButtonText}>Back to Sign in</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    width: 150,
    height: 150,
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
    marginTop: 100,
  },
  textButtonText: {
    color: 'green', // Your theme's green color
    fontSize: 16,
  },
});

export default PasswordReset;
