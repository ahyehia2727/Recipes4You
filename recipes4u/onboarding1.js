import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Ensure this is correctly pointed to your Firebase config

const AllergyChecklistScreen = ({ route }) => {
  const [selectedLabels, setSelectedLabels] = useState({ healthLabels: [], dietLabels: [] });
  const { type } = route.params;
  const db = getFirestore();
  const navigation = useNavigation();

  const healthLabelsList = [
    "Alcohol-Free", "Celery-Free", "Crustacean-Free", "Dairy-Free", "Egg-Free", "Fish-Free",
    "Gluten-Free", "Keto-Friendly", "Kosher", "Low Sugar", "Lupine-Free", "Mustard-Free",
    "No oil added", "Paleo", "Peanut-Free", "Pescatarian", "Pork-Free", "Red-Meat-Free",
    "Sesame-Free", "Shellfish-Free", "Soy-Free", "Sugar-Conscious", "Sulfite-Free",
    "Tree-Nut-Free", "Vegan", "Vegetarian", "Wheat-Free"
  ];

  const majorAllergies = [
    { allergy: "Gluten", avoidWith: "Gluten-Free" },
    { allergy: "Milk", avoidWith: "Dairy-Free" },
    { allergy: "Eggs", avoidWith: "Egg-Free" },
    { allergy: "Fish", avoidWith: "Fish-Free" },
    { allergy: "Crustacean shellfish", avoidWith: "Shellfish-Free" },
    { allergy: "Tree nuts", avoidWith: "Tree-Nut-Free" },
    { allergy: "Peanuts", avoidWith: "Peanut-Free" },
    { allergy: "Wheat", avoidWith: "Wheat-Free" },
    { allergy: "Soybeans", avoidWith: "Soy-Free" },
    { allergy: "Sesame", avoidWith: "Sesame-Free" }
  ];

  const toggleSelection = (allergyItem) => {
    const { avoidWith } = allergyItem;
    const currentHealthLabels = selectedLabels.healthLabels;
    const currentDietLabels = selectedLabels.dietLabels;

    if (currentHealthLabels.includes(avoidWith)) {
      setSelectedLabels({
        ...selectedLabels,
        healthLabels: currentHealthLabels.filter(label => label !== avoidWith),
      });
    } else if (currentDietLabels.includes(avoidWith)) {
      setSelectedLabels({
        ...selectedLabels,
        dietLabels: currentDietLabels.filter(label => label !== avoidWith),
      });
    } else {
      if (healthLabelsList.includes(avoidWith)) {
        setSelectedLabels({
          ...selectedLabels,
          healthLabels: [...currentHealthLabels, avoidWith],
        });
      } else {
        setSelectedLabels({
          ...selectedLabels,
          dietLabels: [...currentDietLabels, avoidWith],
        });
      }
    }
  };

  const saveAllergies = async () => {
    navigation.replace('Diet Restrictions', { type: type});
    const userRef = doc(db, 'useronboarding', auth.currentUser.uid);
    try {
      await setDoc(userRef, {
        user_id: auth.currentUser.uid,
        ...selectedLabels,
      }, { merge: true });
    } catch (error) {
      console.error('Error saving preferences: ', error);
      alert('Failed to save preferences.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.infoText}>
      Enter your allergies to avoid recipes that may contain your allergens!
    </Text>
      {majorAllergies.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.allergyItem,
            (selectedLabels.healthLabels.includes(item.avoidWith) || selectedLabels.dietLabels.includes(item.avoidWith)) && styles.selectedItem
          ]}
          onPress={() => toggleSelection(item)}
        >
          <Text style={styles.text}>{item.allergy}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.saveButton} onPress={saveAllergies}>
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff', // A light green background for the whole screen
  },
  allergyItem: {
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
    fontSize: 12,
    fontWeight:'bold', // Small text size
    fontStyle: 'italic', // Italicize the text
    color: 'green', // Green text color
    textAlign: 'center', // Center the text
    marginBottom: 10, // Add some space at the top
  },
});

export default AllergyChecklistScreen;
