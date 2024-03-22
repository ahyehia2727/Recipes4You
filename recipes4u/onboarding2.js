import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, setDoc,getDoc } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Ensure this is correctly pointed to your Firebase config

const DietSpecificationScreen = ({route}) => {
  const [uiSelected, setUiSelected] = useState({
        category1: null,
        category2: null,
        category3: null,
      });
  const { type } = route.params;
  const [selectedPreferences, setSelectedPreferences] = useState({
    healthconcernsdiet: [],
    category1: '',
    category2: '',
    category3: '',
  });
  const db = getFirestore();
  const navigation = useNavigation();

  const healthLabelsList = [
    "Alcohol-Cocktail",
    "Alcohol-Free",
    "Celery-Free",
    "Crustacean-Free",
    "DASH",
    "Dairy-Free",
    "Egg-Free",
    "FODMAP-Free",
    "Fish-Free",
    "Gluten-Free",
    "Immuno-Supportive",
    "Keto-Friendly",
    "Kidney-Friendly",
    "Kosher",
    "Low Potassium",
    "Low Sugar",
    "Lupine-Free",
    "Mediterranean",
    "Mollusk-Free",
    "Mustard-Free",
    "No oil added",
    "Paleo",
    "Peanut-Free",
    "Pescatarian",
    "Pork-Free",
    "Red-Meat-Free",
    "Sesame-Free",
    "Shellfish-Free",
    "Soy-Free",
    "Sugar-Conscious",
    "Sulfite-Free",
    "Tree-Nut-Free",
    "Vegan",
    "Vegetarian",
    "Wheat-Free"
  ];

  const healthconcernsdiet = [
    { name: "High-Cholesterol/Heart-Healthy Diet", avoidWith: ["Red-Meat-Free","Dairy-Free"] },
    { name: "Diabetic Diet", avoidWith: ["Sugar-Conscious"] },
  ];

  const dietcategory1 = [
    { name: "Vegan Diet", avoidWith: ["Vegan"] },
    { name: "Vegetarian Diet", avoidWith: ["Vegetarian"] },
    { name: "Pescatarian Diet", avoidWith: ["Pescatarian"] },
  ]

  const dietcategory2 = [
    { name: "Muslim-Friendly", avoidWith: ["Pork-Free", "Alcohol-Free"] },
    { name: "Kosher", avoidWith: ["Kosher"] }
  ]

  // Updated function to handle selection
  const handleSelection = (category, selection) => {
    if (category === 'healthconcernsdiet') {
      // For health concerns diet, where multiple selections are allowed
      setSelectedPreferences(prevState => ({
        ...prevState,
        [category]: prevState[category].find(item => item.name === selection.name)
          ? prevState[category].filter(item => item.name !== selection.name) // Deselect if already selected
          : [...prevState[category], selection] // Select if not already selected
      }));
    } else {
      // For categories 1, 2, and 3, where only one selection is allowed
      setSelectedPreferences(prevState => ({
        ...prevState,
        [category]: prevState[category] === selection.avoidWith ? '' : selection.avoidWith,
      }));
      setUiSelected(prevState => ({
        ...prevState,
        [category]: prevState[category] === selection.name ? null : selection.name,
      }));
    }
  };  

  // Updated function to save diet preferences
  const saveDietPreferences = async () => {
    const healthLabels = [];
    const dietLabels = [];

    navigation.replace('Physical Metrics', {type: type });
    // Process each category for healthconcernsdiet
    selectedPreferences.healthconcernsdiet.forEach(selection => {
      selection.avoidWith.forEach(label => {
        if (healthLabelsList.includes(label)) {
          if (!healthLabels.includes(label)) healthLabels.push(label);
        } else {
          if (!dietLabels.includes(label)) dietLabels.push(label);
        }
      });
    });

    // Process single selection categories
    ['category1', 'category2'].forEach(category => {
      if (selectedPreferences[category]) {
        selectedPreferences[category].forEach(label => {
          if (healthLabelsList.includes(label)) {
            if (!healthLabels.includes(label)) healthLabels.push(label);
          } else {
            if (!dietLabels.includes(label)) dietLabels.push(label);
          }
        });
      }
    });

    const userRef = doc(db, 'useronboarding', auth.currentUser.uid);
    try {
      // Fetch the current document state
      const docSnap = await getDoc(userRef);
      
      let existingHealthLabels = [];
      let existingDietLabels = [];
      if (docSnap.exists()) {
        // If document exists, get the current labels
        existingHealthLabels = docSnap.data().healthLabels || [];
        existingDietLabels = docSnap.data().dietLabels || [];
      }
    
      // Combine new labels with existing ones, ensuring no duplicates
      const combinedHealthLabels = [...new Set([...existingHealthLabels, ...healthLabels])];
      const combinedDietLabels = [...new Set([...existingDietLabels, ...dietLabels])];
    
      // Update the document with the combined labels
      await setDoc(userRef, {
        healthLabels: combinedHealthLabels,
        dietLabels: combinedDietLabels,
        user_id: auth.currentUser.uid,
      }, { merge: true });
    } catch (error) {
      console.error('Error saving diet preferences: ', error);
      alert('Failed to save diet preferences.');
    }
  };

  const renderCategory = (categoryData, category) => {
    return categoryData.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.dietItem,
          uiSelected[category] === item.name && styles.selectedItem,
        ]}
        onPress={() => handleSelection(category, item)}
      >
        <Text style={styles.text}>{item.name}</Text>
      </TouchableOpacity>
    ));
  };

  const renderHealthConcernsDiet = () => {
    return healthconcernsdiet.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.dietItem,
          selectedPreferences.healthconcernsdiet.find(selectedItem => selectedItem.name === item.name) ? styles.selectedItem : {},
        ]}
        onPress={() => handleSelection('healthconcernsdiet', item)}
      >
        <Text style={styles.text}>{item.name}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.infoText}>Any Diet Restrictions?</Text>
      <Text style={styles.categoryTitle}>Health Concerns Diet</Text>
      {renderHealthConcernsDiet()}
      <Text style={styles.categoryTitle}>Diet Restrictions</Text>
      {renderCategory(dietcategory1, 'category1')}
      <Text style={styles.categoryTitle}>Special Religious Restrictions</Text>
      {renderCategory(dietcategory2, 'category2')}
      <TouchableOpacity style={styles.saveButton} onPress={saveDietPreferences}>
        <Text style={styles.saveButtonText}>Save Diet Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff', // A light green background for the whole screen
  },
  dietItem: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#10b981', // A shade of green for the border
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff', // White background for items
  },
  selectedItem: {
    backgroundColor: '#a7f3d0', // A lighter green for selected items
  },
  text: {
    fontSize: 18,
    color: '#064e3b', // Dark green text color for better readability
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46', // Darker green for titles
    marginTop: 20,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#059669', // A deep green for the save button
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 20,
    color: '#ffffff', // White text for the button
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

export default DietSpecificationScreen;