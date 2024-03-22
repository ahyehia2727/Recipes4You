import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Your Firebase configuration file

const InteractionsScreen = () => {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute(); // Using the route to access route parameters
  const interactionType = route.params?.interactionType; // Expecting 'like', 'cook', or 'save' passed as a route parameter

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const userId = auth.currentUser.uid; // Get the current user's ID from Firebase Auth
        const db = getFirestore();
        // Query interactions collection for documents where user_id matches current user and interaction_type matches route parameter
        const interactionsQuery = query(collection(db, "interactions"), where("user_id", "==", userId), where("interaction_type", "==", interactionType));
        const querySnapshot = await getDocs(interactionsQuery);
        const recipeIds = querySnapshot.docs.map(doc => doc.data().recipe_id); // Extract recipe IDs from query results

        // Fetch full recipe details using recipe IDs
        const response = await fetch('http://your.network.ip.address:3009/get-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipeIds }),
        });
        const fullRecipes = await response.json();
        setRecipes(fullRecipes); 
        setIsLoading(false);// Assuming the API returns an array of full recipe objects
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    if (interactionType) {
      fetchRecipes();
    }
  }, [interactionType]);

  const renderRecipe = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Details', { recipe: item })}>
      <View style={styles.recipeItem}>
        <Image source={{ uri: item.image }} style={styles.recipeImage} />
        <Text style={styles.recipeLabel}>{item.label}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPlaceholder = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color="green" />; // Or any other loading indicator
    } else {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No recipes found. Start interacting with recipes to see them here!</Text>
        </View>
      );
    }
  };

  return (
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={item => item.uri}
        ListEmptyComponent={renderPlaceholder}
      />
  );
};

const styles = StyleSheet.create({
  recipeItem: {
    backgroundColor:'#e8f5e9',
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'darkgreen',
    alignItems: 'center',
  },
  recipeImage: {
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    marginRight: 10, 
  },
  recipeLabel: {
    color:'green',
    fontSize: 18,
    flex: 1, 
    flexWrap: 'wrap'
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontStyle:'italic',
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
});

export default InteractionsScreen;
