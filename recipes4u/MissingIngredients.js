import React, { useState } from 'react';
import { ScrollView, Text, Button, StyleSheet, Alert, TouchableOpacity,View,Image } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Make sure this path is correct
import { useNavigation } from '@react-navigation/native';

const MissingIngredientsScreen = ({ route }) => {
  const { ingredients, recipeLabel } = route.params;
  const [checkedState, setCheckedState] = useState(new Array(ingredients.length).fill(false));
  const navigation = useNavigation();
  const db = getFirestore();

  const handleCheckboxChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) => index === position ? !item : item);
    setCheckedState(updatedCheckedState);
  };

  const addToShoppingList = async () => {
    const selectedIngredients = ingredients.filter((_, index) => checkedState[index]);

    for (const item of selectedIngredients) {
      const q = query(collection(db, 'shoppinglists'), where('userId', '==', auth.currentUser.uid), where('item', '==', item.food));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Alert.alert('Item already exists', `${item.food} is already in your shopping list.`);
        continue;
      }

      try {
        await addDoc(collection(db, 'shoppinglists'), {
          userId: auth.currentUser.uid,
          item: item.food,
          category: item.foodCategory || 'Uncategorized',
          image: item.image || '',
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error('Error adding item to shopping list:', error);
        Alert.alert('Error', 'There was an issue adding items to your shopping list.');
      }
    }
  };

  const findSimilarRecipes = async () => {
    const excludedIngredients = ingredients.filter((_, index) => checkedState[index]).map(item => item.food);

    try {
      const response = await fetch('http://your.network.ip.address:3007/get-similar-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: recipeLabel,
          excludedIngredients: excludedIngredients,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      navigation.navigate('Similar Recipes', { recipes: data });
    } catch (error) {
      console.error('Error finding similar recipes:', error);
      Alert.alert('Error', 'There was an issue finding similar recipes.');
    }
  };

  const capitalize = (str) => str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.infoText}>
        Select the ingredients you do not have.
      </Text>
      {ingredients.map((ingredient, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.ingredientContainer, checkedState[index] && styles.selectedIngredientContainer]}
          onPress={() => handleCheckboxChange(index)}
        >
          <Image
            source={{ uri: ingredient.image }}
            style={styles.ingredientImage}
          />
          <Text style={styles.ingredientText}>
            {capitalize(ingredient.food)}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonStyle} onPress={addToShoppingList}>
          <Text style={styles.buttonText}>Add to Shopping List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonnStyle} onPress={findSimilarRecipes}>
          <Text style={styles.buttonText}>Find Similar Recipes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedIngredientContainer: {
    backgroundColor: '#c8f5c9', // Background color when selected
  },
  ingredientText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  ingredientImage: {
    width: 50, // Adjust the width as needed
    height: 50, // Adjust the height as needed
    borderRadius: 25, // Make the image round, adjust as needed
    marginRight: 12, // Add some space between the image and the text
  },
  checkboxStyle: {
    marginLeft: 'auto', // Push the checkbox to the right
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonStyle: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonnStyle: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 50,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12, // Small text size
    fontStyle: 'italic', // Italicize the text
    color: 'black', // Green text color
    textAlign: 'center', // Center the text
    marginBottom: 10, // Add some space at the top
  },
});

export default MissingIngredientsScreen;
