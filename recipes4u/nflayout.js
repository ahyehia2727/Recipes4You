import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Assuming this is correctly set up

export default function TabOneScreen() {
  const [makeItAgainRecipes, setMakeItAgainRecipes] = useState([]);
  const [cheatRecipes, setCheatRecipes] = useState([]);
  const [dietRecipes, setDietRecipes] = useState([]);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [mediterraneanRecipes, setMediterraneanRecipes] = useState([]);
  const [asianRecipes, setAsianRecipes] = useState([]);
  const [greenRecipes, setGreenRecipes] = useState([]);
  const [quickRecipes, setQuickAndEasyRecipes] = useState([]);
  const [proteinRecipes, setProteinRecipes] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]); // New state for recommendations
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchUserHealthLabels() {
      const userId = auth.currentUser.uid; // Assuming Firebase Auth is used for user authentication
      const db = getFirestore();
      const userInteractionsQuery = query(collection(db, "useronboarding"), where("user_id", "==", userId));
      const querySnapshot = await getDocs(userInteractionsQuery);

      let allHealthLabels = [];

      querySnapshot.forEach(doc => {
        const docData = doc.data();
        if (docData.healthLabels) {
          allHealthLabels = allHealthLabels.concat(docData.healthLabels);
        }
      });

      const healthLabels = [...new Set(allHealthLabels)];
      return healthLabels;
    }

    async function fetchUserGoal() {
      const userId = auth.currentUser.uid; // Assuming Firebase Auth is used for user authentication
      const db = getFirestore();
      const goalsQuery = query(collection(db, "dailyRecommendations"), where("user_id", "==", userId));
      const querySnapshot = await getDocs(goalsQuery);
    
      let userGoal = ''; // Initialize as an empty string assuming each user has only one goal
    
      querySnapshot.forEach(doc => {
        const docData = doc.data();
        if (docData.goal) {
          userGoal = docData.goal; // Assuming there's only one document per user for their goal
          return; // Exit the loop after finding the goal
        }
      });
    
      return userGoal; // Return the goal string
    }

    async function fetchMakeItAgainRecipes() {
      const userId = auth.currentUser.uid;
      const db = getFirestore();
      const interactionsQuery = query(collection(db, "interactions"), where("user_id", "==", userId), where("interaction_type", "==", "cook"));
      const querySnapshot = await getDocs(interactionsQuery);
    
      let recipeNamesSet = new Set(); // Use a Set to store unique recipe_ids
    
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        // Add recipe_id to the Set, ensuring uniqueness
        recipeNamesSet.add(docData.recipe_id); // Adjust this line based on your data structure
      });
    
      const recipeNames = Array.from(recipeNamesSet); // Convert the Set back to an array
    
      // Check if recipeNames is empty
      if (recipeNames.length === 0) {
        setMakeItAgainRecipes([]); // Set the state to an empty array if no interactions found
        return; // Exit the function early
      }
    
      // Proceed to fetch recipes from the backend if recipeNames is not empty
      try {
        const response = await fetch('http://your.network.ip.address:3003/makeitagain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeNames }),
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
    
        const recipes = await response.json();
        setMakeItAgainRecipes(recipes); // Update the state with the fetched recipes
      } catch (error) {
        console.error('Error fetching Make It Again recipes:', error);
      }
    }    

    async function fetchRecipesBasedOnHealthLabels(healthLabels) {
      try {
        // Fetch recommendations based on healthLabels
        const goal = await fetchUserGoal();
        console.log(goal);
        const recommendationsResponse = await fetch('http://your.network.ip.address:3004/get-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.currentUser.uid, healthLabels, goal }),
        });

        const recommendations = await recommendationsResponse.json();
        setRecommendedRecipes(recommendations);

        const dietResponse = await fetch('http://your.network.ip.address:3014/foryourdiet', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, healthLabels }),
        });

        const dietRecipes = await dietResponse.json();
        setDietRecipes(dietRecipes);

        fetchMakeItAgainRecipes();

        // Fetch quick and easy recipes based on healthLabels (You can adjust the endpoint or parameters as needed)
        const quickAndEasyResponse = await fetch('http://your.network.ip.address:3001/quickandeasy', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const quickAndEasyRecipes = await quickAndEasyResponse.json();
        setQuickAndEasyRecipes(quickAndEasyRecipes);

        const proteinResponse = await fetch('http://your.network.ip.address:3010/proteinpowerhouses', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const proteinpowerhousesRecipes = await proteinResponse.json();
        setProteinRecipes(proteinpowerhousesRecipes);

        const greenResponse = await fetch('http://your.network.ip.address:3011/leanandgreen', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const leanandgreenRecipes = await greenResponse.json();
        setGreenRecipes(leanandgreenRecipes);

        const asianResponse = await fetch('http://your.network.ip.address:3012/asiandelights', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const asiandelightsRecipes = await asianResponse.json();
        setAsianRecipes(asiandelightsRecipes);

        const mediterraneanResponse = await fetch('http://your.network.ip.address:3013/mediterraneanclassics', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const mediterraneanClassicRecipes = await mediterraneanResponse.json();
        setMediterraneanRecipes(mediterraneanClassicRecipes);

        const popularResponse = await fetch('http://your.network.ip.address:3015/crowdpleasers', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const crowdPleasersRecipes = await popularResponse.json();
        setPopularRecipes(crowdPleasersRecipes);

        const cheatResponse = await fetch('http://your.network.ip.address:3016/cheatday', {
          method: 'POST', // Assuming this endpoint also supports POST requests for healthLabels. Adjust if necessary.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthLabels }),
        });

        const cheatDayRecipes = await cheatResponse.json();
        setCheatRecipes(cheatDayRecipes);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchUserHealthLabels().then(healthLabels => {
      fetchRecipesBasedOnHealthLabels(healthLabels);
    });

  }, []);

  const renderRecipe = ({ item, isRecommended }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Details', { recipe: item })}
      style={isRecommended ? styles.recommendedRecipeTouchable : styles.recipeTouchable}
    >
      <View style={isRecommended ? styles.recommendedRecipeItem : styles.recipeItem}>
        <Image source={{ uri: item.image }} style={isRecommended ? styles.recommendedRecipeImage : styles.recipeImage} />
        <Text
          style={styles.recipeLabel}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {item.label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecipeRow = (recipesRow, rowIndex, title) => (
    <View key={`row-${rowIndex}`} style={ rowIndex === -4 ? styles.recommendedRow : styles.row}>
      <Text style={rowIndex === -4 ? styles.recommendedRowTitle : styles.rowTitle}>{title}</Text>
      <FlatList
        horizontal
        data={recipesRow}
        renderItem={({ item }) => renderRecipe({ item, isRecommended: rowIndex === -4 })}
        keyExtractor={(item, index) => `recipe-${rowIndex}-${index}`}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {recommendedRecipes.length > 0 && renderRecipeRow(recommendedRecipes, -4, 'Recommended For You')}
      {dietRecipes.length > 5 && renderRecipeRow(dietRecipes, -3, 'For Your Nutrition Goals')}
      {makeItAgainRecipes.length > 5 && renderRecipeRow(makeItAgainRecipes, -2, 'Why not? Once More')}
      {quickRecipes.length > 0 && renderRecipeRow(quickRecipes, -1, 'Quick & Easy')}
      {proteinRecipes.length > 0 && renderRecipeRow(proteinRecipes, 0, 'Protein Powerhouses')}
      {greenRecipes.length > 0 && renderRecipeRow(greenRecipes, 1, 'Lean & Green')}
      {asianRecipes.length > 0 && renderRecipeRow(asianRecipes, 2, 'Asian Delights')}
      {mediterraneanRecipes.length > 0 && renderRecipeRow(mediterraneanRecipes, 3, 'Mediterranean Classics')}
      {popularRecipes.length > 0 && renderRecipeRow(popularRecipes, 4, 'Crowd Pleasers')}
      {cheatRecipes.length > 0 && renderRecipeRow(cheatRecipes, 5, 'Cheat Day')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 20,
    backgroundColor: 'white',
  },
  recommendedRowTitle: {
    marginLeft:10,
    fontSize: 19, // Slightly larger font size for "Recommended For You"
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
recommendedRecipeTouchable: {
  borderRadius: 8,
  overflow: 'hidden',
  width: 180, 
  height: 240, 
},
recommendedRecipeImage: {
  width: '100%', // Ensure the image covers the card width
  height: 160, // Adjust height to maintain aspect ratio with new card size
  borderRadius: 8,
},
  recommendedRecipeItem: {
    marginLeft:10,
    marginRight: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 1 },
    alignItems: 'center',
  },
  row: {
    marginBottom: 20,
  },
  recommendedRow: {
    marginBottom: -20,
  },
  rowTitle: {
    marginLeft:10,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black', // Now the row title is green
  },
  recipeTouchable: {
    borderRadius: 8,
    overflow: 'hidden',
    width: 120, // Set a fixed width for each recipe item
  },
  recipeItem: {
    marginLeft:10,
    marginRight: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 1 },
    alignItems: 'center', // Center children horizontally
    justifyContent: 'center', // Center children vertically
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  recipeLabel: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle:'italic', // The recipe name is less emphasized
    padding: 5,
    textAlign: 'center',
    color:'green', // Center the label text
  },
});