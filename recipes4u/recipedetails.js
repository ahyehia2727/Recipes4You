import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Button } from 'react-native';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc,doc } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Ensure this is correctly pointed to your Firebase config
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function RecipeDetailScreen({ route }) {
  const [reviewText, setReviewText] = useState('');
  const [reviewSentiment, setReviewSentiment] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { recipe } = route.params;
  const [likesCount, setLikesCount] = useState(recipe.likesCount || 0); // Initialize with the recipe's initial likes count
  const [dislikesCount, setDislikesCount] = useState(recipe.dislikesCount || 0); // Initialize with the recipe's initial dislikes count
  const db = getFirestore();
  const navigation = useNavigation();
  const [viewStartTime, setViewStartTime] = useState(Date.now());
  useEffect(() => {
    // Existing logic for checking interaction state
    checkInteractionState();

    // Set the view start time when the component mounts
    setViewStartTime(Date.now());

    // Cleanup function to log view duration when the component unmounts
    return () => {
      const viewEndTime = Date.now();
      const viewDuration = (viewEndTime - viewStartTime) / 1000; // Convert to seconds
      if (viewDuration > 5) {
        // Log the view duration only if it's a meaningful amount of time
        logInteraction('view', { view_duration: viewDuration });
      }
    };
  }, []);

  const checkInteractionState = async () => {
    const interactionsRef = collection(db, 'interactions');
    const q = query(interactionsRef, where('user_id', '==', auth.currentUser.uid), where('recipe_id', '==', recipe.label));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      switch (data.interaction_type) {
        case 'like':
          setIsLiked(true);
          setLikesCount(likesCount + 1)
          break;
        case 'dislike':
          setIsDisliked(true);
          setDislikesCount(dislikesCount + 1)
          break;
        case 'save':
          setIsSaved(true);
          break;
        default:
          break;
      }
    });
  };

  const sendInteractionToBackend = async (interactionType, action, adjustOpposite) => {
    const interactionData = {
      label: recipe.label,
      type: interactionType,
      action: action,
      adjustOpposite: adjustOpposite,
    };

    // Fetch call to send the interaction data to the backend
    fetch('http://your.network.ip.address:3005/api/recipes/interact', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactionData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to send interaction to backend');
      }
      return response.json();
    })
    .then(data => console.log(data))
    .catch(error => console.error('Error sending interaction to backend:', error));
};


const toggleInteraction = async (interactionType) => {
  let action = '';
  let adjustOpposite = false;

  // Optimistically update UI before backend operations
  if (interactionType === 'like') {
    if (!isLiked) {
      setIsLiked(true); // Assume like will succeed
      setLikesCount(likesCount + 1);
      if (isDisliked) {
        setIsDisliked(false); // Switching from dislike to like
        setDislikesCount(dislikesCount - 1);
      }
      action = 'add';
    } else {
      setIsLiked(false); // Assume unlike will succeed
      setLikesCount(likesCount - 1);
      action = 'remove';
    }
  } else if (interactionType === 'dislike') {
    if (!isDisliked) {
      setIsDisliked(true); // Assume dislike will succeed
      setDislikesCount(dislikesCount + 1);
      if (isLiked) {
        setIsLiked(false); // Switching from like to dislike
        setLikesCount(likesCount - 1);
      }
      action = 'add';
    } else {
      setIsDisliked(false); // Assume undislike will succeed
      setDislikesCount(dislikesCount - 1);
      action = 'remove';
    }
  } else if (interactionType === 'save') {
    setIsSaved(!isSaved); // Toggle saved state
    // No action or adjustOpposite needed since this doesn't affect likes/dislikes
  }

  adjustOpposite = interactionType === 'like' ? isDisliked : (interactionType === 'dislike' ? isLiked : false);

  // After optimistic UI update, proceed with backend operations
  const interactionsRef = collection(db, 'interactions');
  let currentInteractionType = interactionType;
  let oppositeInteractionType = interactionType === 'like' ? 'dislike' : (interactionType === 'dislike' ? 'like' : null);

  const q = query(interactionsRef, where('user_id', '==', auth.currentUser.uid), where('recipe_id', '==', recipe.label), where('interaction_type', 'in', [currentInteractionType, oppositeInteractionType].filter(Boolean)));

  const querySnapshot = await getDocs(q);
  let foundCurrentInteraction = false;
  let foundOppositeInteractionDocRef = null;

  querySnapshot.forEach((doc) => {
    if (doc.data().interaction_type === currentInteractionType) {
      foundCurrentInteraction = true;
      deleteDoc(doc.ref); // Continue with deleting current interaction
    } else if (doc.data().interaction_type === oppositeInteractionType) {
      foundOppositeInteractionDocRef = doc.ref; // Keep reference to delete opposite interaction if exists
    }
  });

  if (!foundCurrentInteraction && currentInteractionType) {
    // If the current interaction type was not found, log it
    await addDoc(interactionsRef, {
      user_id: auth.currentUser.uid,
      recipe_id: recipe.label,
      interaction_type: currentInteractionType,
      timestamp: serverTimestamp(),
    });
  }

  if (foundOppositeInteractionDocRef && oppositeInteractionType) {
    // If the opposite interaction was found, remove it
    await deleteDoc(foundOppositeInteractionDocRef);
  }

  // Send backend call
  if (interactionType !== 'save') { // No need to call backend for 'save' interactions in this snippet
    sendInteractionToBackend(interactionType, action, adjustOpposite).catch(console.error);
  }
};

  // Calculating nutrition per serving using your logic
  const nutritionPerServing = {
    calories: recipe.calories ? recipe.calories.toFixed(2) : 'N/A',
    servings: recipe.yield || 'N/A',
    fats: 'N/A',
    carbs: 'N/A',
    protein: 'N/A',
    cuisine: recipe.cuisineType.join(', ') || 'N/A',
    mealType: recipe.mealType.join(', ') || 'N/A',
  };

  // Iterate through the digest array to find and set fats, carbs, and protein
  recipe.digest.forEach(nutrient => {
    switch (nutrient.tag) {
      case 'FAT':
        nutritionPerServing.fats = `${nutrient.total.toFixed(2)}g`;
        break;
      case 'CHOCDF':
        nutritionPerServing.carbs = `${nutrient.total.toFixed(2)}g`;
        break;
      case 'PROCNT':
        nutritionPerServing.protein = `${nutrient.total.toFixed(2)}g`;
        break;
      default:
        break;
    }
  });

  // Function for logging interactions
  const logInteraction = async (interactionType, additionalData = {}) => {
    const db = getFirestore();
    const interactionData = {
      user_id: auth.currentUser ? auth.currentUser.uid : 'anonymous',
      recipe_id: recipe.label,
      interaction_type: interactionType,
      timestamp: serverTimestamp(),
      ...additionalData
    };
    console.log(auth.currentUser.email)
    try {
      await addDoc(collection(db, 'interactions'), interactionData);
      console.log(`Interaction logged: ${interactionType}`);
    } catch (error) {
      console.error('Error logging interaction: ', error);
    }
  };

  const formatCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`; // Formats the number into x.k format
    }
    return count.toString(); // Returns the number as a string if below 1000
  };  

  const renderInteractionButton = (iconName, isActive, onPress, count = null) => (
    <TouchableOpacity onPress={onPress} style={styles.interactionButton}>
      <Ionicons name={iconName} size={24} color={isActive ? 'green' : 'black'} />
      {count !== null && <Text style={styles.interactionButtonText}>{formatCount(count)}</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: recipe.image }} style={styles.image} />
      <View style={styles.titleWithCookCount}>
        <Text style={styles.label}>{recipe.label}</Text>
        <View style={styles.cookedCountContainer}>
          <Ionicons name="flame" size={24} color="red" />
          <Text style={styles.cookedCountText}>{formatCount(recipe.cookCount || 0)}</Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
  {renderInteractionButton(isLiked ? 'heart' : 'heart-outline', isLiked, () => toggleInteraction('like'), likesCount)}
  {renderInteractionButton(isDisliked ? 'thumbs-down' : 'thumbs-down-outline', isDisliked, () => toggleInteraction('dislike'), dislikesCount)}
  {renderInteractionButton(isSaved ? 'bookmark' : 'bookmark-outline', isSaved, () => toggleInteraction('save'))}
  <TouchableOpacity
    onPress={() => navigation.navigate('Reviews', { image:recipe.image,label: recipe.label })}
    style={styles.reviewButton}>
    <Text style={styles.reviewButtonText}>See reviews...</Text>
  </TouchableOpacity>
</View>
      <View style={styles.infoContainer}>
  <Text style={styles.infoTitle}>Recipe Overview</Text>
  <View style={styles.nutritionalCard}>
    <Text style={styles.nutritionalLabel}>Cuisine: <Text style={styles.nutritionalValue}>{nutritionPerServing.cuisine}</Text></Text>
    <Text style={styles.nutritionalLabel}>Meal Type: <Text style={styles.nutritionalValue}>{nutritionPerServing.mealType}</Text></Text>
    <Text style={styles.nutritionalLabel}>Servings: <Text style={styles.nutritionalValue}>{nutritionPerServing.servings}</Text></Text>
    <Text style={styles.nutritionalLabel}>Calories: <Text style={styles.nutritionalValue}>{nutritionPerServing.calories} per serving</Text></Text>
    <Text style={styles.nutritionalLabel}>Fats: <Text style={styles.nutritionalValue}>{nutritionPerServing.fats} per serving</Text></Text>
    <Text style={styles.nutritionalLabel}>Carbs: <Text style={styles.nutritionalValue}>{nutritionPerServing.carbs} per serving</Text></Text>
    <Text style={styles.nutritionalLabel}>Protein: <Text style={styles.nutritionalValue}>{nutritionPerServing.protein} per serving</Text></Text>
  </View>
  <Text style={styles.sectionTitle}>Ingredients</Text>
  <View style={styles.ingredientsCard}>
    {recipe.ingredientLines.map((ingredient, index) => (
      <Text key={index} style={styles.ingredient}>
        - {ingredient}
      </Text>
    ))}
  </View>
</View>
<Button style={styles.button} color='black' title="Don't Have These Ingredients?"  onPress={() => navigation.navigate('Missing Ingredients', {ingredients: recipe.ingredients,recipeLabel: recipe.label})}/>
<TouchableOpacity onPress={() => navigation.navigate('Instructions', {instructions: recipe.instructionLines, label: recipe.label, image:recipe.image,ingredients:recipe.ingredients})} style={styles.customButton}>
  <Text style={styles.buttonText}>Start Cooking</Text>
</TouchableOpacity>
    </ScrollView> 
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor:'#fff',
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    marginBottom: 5,
  },
  cookCountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 2,
  },
  reviewSection: {
    marginTop: 20,
  },
  sentimentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
  },
  interactionButtonText: {
    marginLeft: 5,
    color: 'black', // Update as needed
  },
  interactionButtonActive: {
    backgroundColor: 'green',
  },
  interactionButtonTextActive: {
    color: 'white',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    alignItems: 'center', // Ensure items are vertically centered
  },
  label: {
    flex: 1, // Take up the remaining space
    fontSize: 20,
    fontWeight: 'bold',
    color:'black'
  },
  cookedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10, // Space between label and cook count
  },
  cookedCountText: {
    marginLeft: 5,
    fontWeight: 'bold',
    color:'black',
  },
  infoContainer: {
    paddingVertical: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  nutritionalCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  nutritionalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  nutritionalValue: {
    fontWeight: 'normal',
  },
  ingredientsCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 5,
    color:'black'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  customButton: {
    backgroundColor: 'black', // A pleasant blue color
    padding: 15, // Ample padding for touchability
    borderRadius: 5, // Slightly rounded corners
    alignItems: 'center', // Center the text inside the button
    marginBottom: 10,
    marginTop:20 // Space between buttons
  },
  buttonText: {
    color: 'white', // White text for better contrast
    fontSize: 16, // Slightly larger text
    fontWeight: 'bold', // Bold text
  },
  cookCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  titleWithCookCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    size:'small',
  },
  reviewButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    backgroundColor: 'white', // A light green background
    borderRadius: 20,
  },
  reviewButtonText: {
    fontSize: 12, // Smaller font size for the "See reviews..." text
    color: 'black', // Green text color to match the theme
  },
});
