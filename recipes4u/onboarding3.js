import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Ensure this is correctly pointed to your Firebase config

const CalculatorScreen = ({ route }) => {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('maintenance');
  const [results, setResults] = useState(null); 
  const { type } = route.params;
  const navigation = useNavigation();
  const db = getFirestore();

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const activityOptions = [
    { label: 'Sedentary', value: 'sedentary' },
    { label: 'Lightly Active', value: 'lightly_active' },
    { label: 'Moderately Active', value: 'moderately_active' },
    { label: 'Very Active', value: 'very_active' },
    { label: 'Extra Active', value: 'extra_active' },
  ];

  const goalOptions = [
    { label: 'Weight Loss', value: 'weight_loss' },
    { label: 'Extreme Weight Loss', value: 'extreme_weight_loss' },
    { label: 'Muscle Building', value: 'muscle_building' },
    { label: 'Maintenance', value: 'maintenance' },
  ];

  // Inline option selection logic
  const renderOption = (options, selectedValue, onSelect) => (
    <View style={styles.selectorContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionItem,
            selectedValue === option.value && styles.selectedOptionItem,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={styles.optionItemText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  function calculateDailyCalories(weight, height, age, gender, activityLevel, goal) {
    let bmr = gender === 'male' ?
      10 * weight + 6.25 * height - 5 * age + 5 :
      10 * weight + 6.25 * height - 5 * age - 161;

    let maintenanceCalories = bmr;

    switch (activityLevel) {
      case 'sedentary':
        maintenanceCalories *= 1.2;
        break;
      case 'lightly_active':
        maintenanceCalories *= 1.375;
        break;
      case 'moderately_active':
        maintenanceCalories *= 1.55;
        break;
      case 'very_active':
        maintenanceCalories *= 1.725;
        break;
      case 'extra_active':
        maintenanceCalories *= 1.9;
        break;
    }

    switch (goal) {
      case 'extreme_weight_loss':
        return maintenanceCalories - 700;
      case 'weight_loss':
        return maintenanceCalories - 400;
      case 'muscle_building':
        return maintenanceCalories + 500;
      default:
        return maintenanceCalories;
    }
  }

  function calculateMacros(calories, goal) {
    let carbRatio = 0.47;
    let proteinRatio = 0.3;
    let fatRatio = 0.23;

    switch (goal) {
      case 'extreme_weight_loss':
        proteinRatio = 0.3;
        carbRatio = 0.45;
        fatRatio = 0.25;
        break;
      case 'weight_loss':
        proteinRatio = 0.3;
        carbRatio = 0.4;
        fatRatio = 0.3;
        break;
      case 'muscle_building':
        proteinRatio = 0.3;
        carbRatio = 0.45;
        fatRatio = 0.25;
        break;
      case 'maintenance':
        proteinRatio = 0.25;
        carbRatio = 0.5;
        fatRatio = 0.25;
        break;
    }

    return {
      carbs: Math.round((calories * carbRatio) / 4),
      protein: Math.round((calories * proteinRatio) / 4),
      fat: Math.round((calories * fatRatio) / 9),
    };
  }

  const handleCalculateAndStore = async () => {
    if (!age || !height || !weight) {
      alert('Error: Please enter all fields');
      return; // Early return to prevent further execution
    }

    if(type === 'signin') {
      navigation.replace('Recipes4You');
    }
    else {
      navigation.replace('Recipes4You', { screen: 'TabFour' });
    }
    const dailyCalories = calculateDailyCalories(
      parseFloat(weight), parseFloat(height), parseInt(age, 10), gender, activityLevel, goal
    );
    const macros = calculateMacros(dailyCalories, goal);
    setResults({ dailyCalories, macros });

    // Firestore document reference for daily recommendations
    const recommendationsRef = doc(db, 'dailyRecommendations', auth.currentUser.uid);
    // Firestore document reference for onboarding completion
    const completionRef = doc(db, 'completedonboarding', auth.currentUser.uid);

    try {
      // Store the calculated results in Firestore
      await setDoc(recommendationsRef, {
        user_id:auth.currentUser.uid,
        age,
        weight,
        height,
        gender,
        activityLevel,
        goal,
        dailyCalories: dailyCalories.toFixed(2),
        macros,
      }, { merge: true });

      // Mark the onboarding process as completed for this user
      await setDoc(completionRef, {
        userId: auth.currentUser.uid,
        completedOnboarding: true,
      }, { merge: true });
    } catch (error) {
      console.error('Error saving recommendations or completing onboarding: ', error);
      alert('Failed to save recommendations or complete onboarding.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.infoText}>Input Your Physical Metrics to reach your nutrition and health goals easier!</Text>
      <TextInput
        style={styles.input}
        placeholder="Age"
        placeholderTextColor="#999"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        placeholderTextColor="#999"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        placeholderTextColor="#999"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
      />

      <Text style={styles.text}>Gender</Text>
      {renderOption(genderOptions, gender, setGender)}

      <Text style={styles.text}>Activity Level</Text>
      {renderOption(activityOptions, activityLevel, setActivityLevel)}

      <Text style={styles.text}>Goal</Text>
      {renderOption(goalOptions, goal, setGoal)}

      <Button
        title="Calculate & Save"
        onPress={handleCalculateAndStore}
        color="#2e7d32"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start', // Adjusted for better alignment
    backgroundColor: '#fff', // Light green background
  },
  input: {
    width: '100%',
    height: 50, // Adjusted for better touch area
    borderColor: 'green',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15, // Increased spacing
    padding: 10,
    fontSize: 16, // Increased for readability
    color: '#000',
    backgroundColor: '#FFF',
  },
  selectorContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  optionItem: {
    backgroundColor: '#FFF',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
  },
  selectedOptionItem: {
    backgroundColor: '#c8e6c9', // Slightly darker green for selected items
    borderColor: '#2e7d32', // Darker green border for selected items
  },
  optionItemText: {
    color: '#2e7d32',
    fontSize: 16, // Adjusted for readability
    textAlign: 'center', // Center-aligned text
  },
  text: {
    alignSelf: 'flex-start',
    color: '#2e7d32',
    marginBottom: 10, // Increased spacing
    fontWeight: 'bold',
    fontSize: 18, // Made titles larger for better visibility
    width: '100%', // Ensure full width for alignment
  },
  resultsContainer: {
    marginTop: 20,
    width: '100%', // Ensure full width for alignment
  },
  resultsText: {
    color: '#000',
    fontSize: 16,
    marginBottom: 10, // Increased spacing
  },
  button: {
    backgroundColor: '#2e7d32', // Green background for buttons
    color: '#ffffff', // White text for buttons
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight:'bold', // Small text size
    fontStyle: 'italic', // Italicize the text
    color: 'green', // Green text color
    textAlign: 'center', // Center the text
    marginBottom: 5, // Add some space at the top
  },
});


export default CalculatorScreen;
