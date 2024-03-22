import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal,Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, where, getDocs, getDoc, doc, serverTimestamp, setDoc,deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from './firebaseconfig';
import { signOut } from 'firebase/auth';
import { ProgressBar } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const TrackingScreen = () => {
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState(false);
  const [manualCalories, setManualCalories] = useState('');
  const [manualFats, setManualFats] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [consumptionAmount, setConsumptionAmount] = useState('');
  const [unit, setUnit] = useState('serving');
  const [selectedRecipe, setSelectedRecipe] = useState({});
  const [cookedRecipes, setCookedRecipes] = useState([]);
  const [dailyConsumption, setDailyConsumption] = useState([]); // Added state for dailyConsumption
  const [dailyRecommendations, setDailyRecommendations] = useState({dailyCalories: 0, macros: {fat: 0, carbs: 0, protein: 0}});
  const [totalConsumed, setTotalConsumed] = useState({calories: 0, fat: 0, carbs: 0, protein: 0});
  const [isUpdate, setIsUpdate] = useState(false);
  const navigation = useNavigation();
  const db = getFirestore();

  useEffect(() => {
    const initializeData = async () => {
      await fetchDailyRecommendations(); // Fetch daily recommendations
      await fetchCookedRecipes();
      await fetchConsumptionData(); // Fetch and calculate the total consumed nutrition AND daily consumption details
    };
    initializeData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await fetchDailyRecommendations(); 
        await fetchCookedRecipes();
        await fetchConsumptionData();
      };

      fetchData();
    }, []) 
  );

  const handleManualSubmit = async () => {
    if (!manualCalories || !manualFats || !manualCarbs || !manualProtein) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    Alert.alert('Success', 'Manual consumption data added.');
    setManualEntryModalVisible(false);
    setManualCalories('');
    setManualFats('');
    setManualCarbs('');
    setManualProtein('');

    const newDocRef = doc(collection(db, 'dailyConsumption'));
    await setDoc(newDocRef, {
      userId: auth.currentUser.uid,
      recipe: 'manual',
      caloriesConsumed: parseFloat(manualCalories),
      fatsConsumed: parseFloat(manualFats),
      carbsConsumed: parseFloat(manualCarbs),
      proteinConsumed: parseFloat(manualProtein),
      timestamp: serverTimestamp()
    });
    fetchCookedRecipes();
    fetchConsumptionData();
  };


  const fetchDailyRecommendations = async () => {
    try {
      const docRef = doc(db, 'dailyRecommendations', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDailyRecommendations(docSnap.data());
      } else {
        console.log("No daily recommendations found!");
      }
    } catch (error) {
      console.error("Error fetching daily recommendations:", error);
    }
  };  

  const fetchConsumptionData = async () => {
    try {
      // Fetch the daily consumption documents for the current user
      const q = query(collection(db, 'dailyConsumption'), where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
  
      // Sum the calories and macros for each document AND store daily consumption separately
      const totals = querySnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc.dailyConsumption.push(data); // Store each consumption record for comparison later
        return {
          ...acc,
          calories: acc.calories + parseFloat(data.caloriesConsumed),
          fat: acc.fat + parseFloat(data.fatsConsumed),
          carbs: acc.carbs + parseFloat(data.carbsConsumed),
          protein: acc.protein + parseFloat(data.proteinConsumed),
        };
      }, { calories: 0, fat: 0, carbs: 0, protein: 0, dailyConsumption: [] });
  
      setTotalConsumed({calories: totals.calories.toFixed(0), fat: totals.fat.toFixed(2), carbs: totals.carbs.toFixed(2), protein: totals.protein.toFixed(2)});
      setDailyConsumption(totals.dailyConsumption); // Update state with daily consumption data
    } catch (error) {
      console.log("Error fetching consumption data:", error);
    }
  };

  const fetchCookedRecipes = async () => {
    try {
      let lastResetValue = await AsyncStorage.getItem('@lastRestart');
      if (lastResetValue === null) {
        // For new users or if @lastRestart is not set, initialize it with a very old date
        const veryOldDate = new Date('2000-01-01').toISOString();
        await AsyncStorage.setItem('@lastRestart', veryOldDate);
        lastResetValue = veryOldDate;
      }
      const lastReset = new Date(lastResetValue);
      const q = query(collection(db, 'interactions'), where('user_id', '==', auth.currentUser.uid), where('interaction_type', '==', 'cook'));
      const querySnapshot = await getDocs(q);
      const recipeIdsSet = new Set();
      const uniqueRecipes = [];
  
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const recipe_id = data.recipe_id; // Assuming each document has a 'recipe_id' field
        const timestamp = new Date(data.timestamp.seconds * 1000).getTime();
  
        // Check if the timestamp is after the last reset and if the recipe_id hasn't been added yet
        if (timestamp > lastReset.getTime() && !recipeIdsSet.has(recipe_id)) {
          uniqueRecipes.push({ ...data, id: doc.id }); // Add the document data along with its Firestore ID
          recipeIdsSet.add(recipe_id); // Mark this recipe_id as processed
        }
      });
  
      // Set the cooked recipes with the array of unique recipes
      setCookedRecipes(uniqueRecipes);
    } catch (error) {
      console.error("Error fetching consumed recipes:", error);
      Alert.alert('Error', 'Failed to fetch consumed recipes.');
    }
  };  
  
  const handleSelectRecipe = (recipe) => {
    const consumedRecipe = dailyConsumption.find(item => item.recipe === recipe.recipe_id);
    setIsUpdate(!!consumedRecipe); // Set to true if found, false otherwise
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };  

  const handleSubmit = async () => {
    if (!selectedRecipe || !consumptionAmount || isNaN(consumptionAmount)) {
      Alert.alert('Error', 'Please enter a valid number.');
      return;
    }
  
    fetch('http://your.network.ip.address:3008/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeName: selectedRecipe.recipe_id, // Ensure you use selectedRecipe.recipe_id or the correct property
        unit,
        amount: parseFloat(consumptionAmount),
      }),
    })
    .then(response => response.json())
    .then(async data => {
      const consumptionRef = doc(db, 'dailyConsumption', `${auth.currentUser.uid}_${selectedRecipe.id}`);
      await setDoc(consumptionRef, {
        userId:auth.currentUser.uid,
        recipe:selectedRecipe.recipe_id,
        unit:unit,
        amount:parseFloat(consumptionAmount),
        ...data, // Assuming 'data' is the object with fields you want to update/create
        timestamp: serverTimestamp()
      }, { merge: true }); // This ensures that existing documents are updated, and new documents are created if they don't exist.
      Alert.alert('Success', 'Nutrition info updated successfully.');
      setModalVisible(false);
      setSelectedRecipe({});
      setConsumptionAmount('');
      fetchCookedRecipes();
      fetchConsumptionData();
    })
    .catch(error => {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to calculate nutrition info.');
    });
  };

  const handleResetDailyConsumption = async () => {
    const now = new Date();
    Alert.alert('Success', 'Daily consumption data reset.');
    setTotalConsumed({calories: 0, fat: 0, carbs: 0, protein: 0});
    try {
      // Fetch all dailyConsumption records for the current user
      const q = query(collection(db, 'dailyConsumption'), where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
  
      // Delete each record found
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref); // Delete the document
      }
  
      // Reset the AsyncStorage and state after successfully deleting records
      await AsyncStorage.setItem('@lastRestart', now.toISOString());

      const value = await AsyncStorage.getItem('@lastRestart');

      console.log('lastRestart now:', value);
      await fetchCookedRecipes();
      await fetchConsumptionData();
    } catch (error) {
      console.error('Error resetting daily consumption:', error);
      Alert.alert('Error', 'Failed to reset daily consumption data.');
    }
  };  

  const renderProgressBar = (current, goal, label) => {
    // Ensure both current and goal are numbers and goal is not zero to avoid NaN result
    const progress = !isNaN(current) && !isNaN(goal) && goal > 0 ? current / goal : 0;
  
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>{label}: {current} / {goal}</Text>
        <ProgressBar progress={progress} color="#2e7d32" style={styles.progressBar} />
      </View>
    );
  };  

  const CustomButton = ({ title, onPress, icon, style }) => (
    <TouchableOpacity onPress={onPress} style={[styles.customButton, style]}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );

  const handleDeleteManualEntry = async (calories, fats, carbs, protein) => {
    const q = query(collection(db, 'dailyConsumption'), 
      where('userId', '==', auth.currentUser.uid),
      where('recipe', '==', 'manual'),
      where('caloriesConsumed', '==', parseFloat(calories)),
      where('fatsConsumed', '==', parseFloat(fats)),
      where('carbsConsumed', '==', parseFloat(carbs)),
      where('proteinConsumed', '==', parseFloat(protein))
    );
  
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Delete the first document that matches the criteria
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'dailyConsumption', docToDelete.id));
        // Refresh the list of entries
        await fetchConsumptionData();
      } else {
        Alert.alert('Error', 'No matching entry found.');
      }
    } catch (error) {
      console.error('Error deleting manual entry:', error);
      Alert.alert('Error', 'Failed to delete the entry.');
    }
  };  

    return (
      <ScrollView style={styles.container}>
        
        <View style={styles.nutritionGoalsSection}>
          <Text style={styles.sectionTitle}>Daily Nutrient Goals</Text>
          {renderProgressBar(totalConsumed.calories, dailyRecommendations.dailyCalories, 'Calories')}
          {renderProgressBar(totalConsumed.fat, dailyRecommendations.macros.fat, 'Fat')}
          {renderProgressBar(totalConsumed.carbs, dailyRecommendations.macros.carbs, 'Carbs')}
          {renderProgressBar(totalConsumed.protein, dailyRecommendations.macros.protein, 'Protein')}
        </View>
        <CustomButton title="Reset Daily Consumption" onPress={handleResetDailyConsumption} />
        <View style={styles.sectionContainer}>
  <Text style={styles.sectionHeader}>Cooked Recipes</Text>
  {cookedRecipes.length != 0 && (
    <Text style={styles.infoText}>
      Click on the recipe to add/update consumption data
    </Text>
  )}
  {cookedRecipes.length === 0 && (
    <Text style={styles.messageText}>
      You must be starving! Cook some recipes and they will be displayed here.
    </Text>
  )}
  {cookedRecipes.map((recipe, index) => {
  const consumedRecipe = dailyConsumption.find(item => item.recipe === recipe.recipe_id);

  return (
    <TouchableOpacity
      key={index}
      style={{
        ...styles.recipeItem,
        backgroundColor: consumedRecipe ? '#c8e6c9' : '#f8f8f8',
      }}
      onPress={() => handleSelectRecipe(recipe)}
    >
      <Image
        source={{ uri: recipe.recipe_image }}
        style={styles.recipeImage}
      />
      <View style={styles.recipeTextContainer}>
        <Text style={styles.recipeText}>{recipe.recipe_id}</Text>
      </View>
      {consumedRecipe && (
        <View style={styles.consumedDetails}>
          <Text style={styles.detailText}>Consumed:</Text>
          <Text style={styles.detailText}>Calories: {consumedRecipe.caloriesConsumed}</Text>
          <Text style={styles.detailText}>Fats: {consumedRecipe.fatsConsumed}g</Text>
          <Text style={styles.detailText}>Carbs: {consumedRecipe.carbsConsumed}g</Text>
          <Text style={styles.detailText}>Protein: {consumedRecipe.proteinConsumed}g</Text>
        </View>
      )}
    </TouchableOpacity>
  );
})}
</View>

{/* Manually Added Consumption Section */}
<View style={styles.sectionnContainer}>
  <Text style={styles.sectionHeader}>Manual Entries</Text>
  {dailyConsumption.filter(item => item.recipe === 'manual').map((item, index) => (
  <View key={index} style={styles.manualEntryItem}>
    <Text style={styles.manualEntryText}>
      Calories: {item.caloriesConsumed}, Fats: {item.fatsConsumed}g, Carbs: {item.carbsConsumed}g, Protein: {item.proteinConsumed}g
    </Text>
    {/* Delete Icon Button */}
    <TouchableOpacity
      onPress={() => handleDeleteManualEntry(item.caloriesConsumed, item.fatsConsumed, item.carbsConsumed, item.proteinConsumed)}
      style={styles.deleteIconButton}>
      <FontAwesome name="trash" size={24} color="red" />
    </TouchableOpacity>
  </View>
))}
  {/* Add Entry Button */}
  <TouchableOpacity onPress={() => setManualEntryModalVisible(true)} style={styles.addEntryButton}>
    <Text style={styles.addEntryButtonText}>Add Entry</Text>
  </TouchableOpacity>
</View>
<Text style={styles.buttonTitle}>Profile and Preferences</Text>
  <View style={styles.buttonSection}>

<CustomButton
  title=" Update Your Information"
  onPress={() => navigation.navigate('Enter Your Allergies', {type: 'update'})}
  icon={<FontAwesome name="pencil-square-o" size={24} color="#ffff" />}
/>

<CustomButton
  title=" Liked"
  onPress={() => navigation.navigate('View Recipes', {interactionType: 'like'})}
  icon={<FontAwesome name="heart" size={24} color="#ffff" />}
/>

<CustomButton
  title=" Cooked"
  onPress={() => navigation.navigate('View Recipes', {interactionType: 'cook'})}
  icon={<FontAwesome name="fire" size={24} color="#ffff" />}
/>

<CustomButton
  title=" Saved"
  onPress={() => navigation.navigate('View Recipes', {interactionType: 'save'})}
  icon={<FontAwesome name="bookmark" size={24} color="#ffff" />}
/>

<CustomButton
  style={styles.signout}
  title=" Sign Out"
  onPress={() => {
    signOut(auth).then(() => {
      navigation.replace('Sign In');
    }).catch((error) => {
      console.error("Sign-out error:", error);
    });
  }}
  icon={<FontAwesome name="sign-out" size={24} color="#ffff" />}
/>
  </View>

  <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => setModalVisible(!modalVisible)}
  >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <Text style={styles.modalText}> {isUpdate ? 'Update Consumption Data for ' : 'Log Consumption for '}{selectedRecipe.recipe_id} </Text>
        <TextInput
          style={styles.input}
          onChangeText={setConsumptionAmount}
          value={consumptionAmount}
          placeholder="Enter number of servings or grams"
          placeholderTextColor="#757575"
          keyboardType="numeric"
        />
        <View style={styles.buttonContainer}>
          <Button onPress={() => setUnit('serving')} title="Serving" color={unit === 'serving' ? 'green' : '#ccc'} />
          <Button onPress={() => setUnit('gram')} title="Gram" color={unit === 'gram' ? 'green' : '#ccc'} />
        </View>
        <Button onPress={handleSubmit} color = 'black' title="Submit" />
        <Button onPress={() => setModalVisible(false)} color = 'black' title="Cancel" />
      </View>
    </View>
  </Modal>

  {/* Manually Add Consumption Modal */}
  <Modal
    animationType="slide"
    transparent={true}
    visible={manualEntryModalVisible}
    onRequestClose={() => setManualEntryModalVisible(!manualEntryModalVisible)}
  >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <Text style={styles.modalText}>Manual Consumption Entry</Text>
        <TextInput style={styles.input} onChangeText={setManualCalories} value={manualCalories} placeholder="Calories" placeholderTextColor="#757575" keyboardType="numeric" />
        <TextInput style={styles.input} onChangeText={setManualFats} value={manualFats} placeholder="Fats (g)" placeholderTextColor="#757575" keyboardType="numeric" />
        <TextInput style={styles.input} onChangeText={setManualCarbs} value={manualCarbs} placeholder="Carbs (g)" placeholderTextColor="#757575" keyboardType="numeric" />
        <TextInput style={styles.input} onChangeText={setManualProtein} value={manualProtein} placeholder="Protein (g)" placeholderTextColor="#757575" keyboardType="numeric" />
        <Button onPress={handleManualSubmit} title="Submit" />
        <Button onPress={() => setManualEntryModalVisible(false)} title="Cancel" />
      </View>
    </View>
  </Modal>
</ScrollView>
);
};

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 10,
  backgroundColor:'#fff',
  },
  header: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#2e7d32',
  marginBottom: 20,
  },
  recipeImage: {
    width: 50, // Set the width
    height: 50, // Set the height
    borderRadius: 25, // Make it circular
    marginRight: 25, // Add some space between the image and the text
  },
  sectionTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: '#000',
  marginBottom: 10,
  },
  progressContainer: {
  marginBottom: 10,
  },
  progressLabel: {
  color: '#424242',
  marginBottom: 5,
  },
  progressBar: {
  height: 8,
  borderRadius: 4,
  },
  customButton: {
  backgroundColor: '#000',
  padding: 10,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent:'center',
  marginBottom: 10,
  flexDirection: 'row',
  },
  buttonText: {
  color: '#ffffff',
  fontSize: 16,
  },
  centeredView: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1.5, // Slightly thicker border for better visibility
    borderColor: '#000', // Darker border color for contrast
    borderRadius: 8,
    padding: 10,
    width: '100%',
    backgroundColor: '#f9f9f9',
    shadowColor: '#000', // Adding shadow for depth
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3, // Elevate the TextInput to make it stand out
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    // Centering content within the modal for better focus
    justifyContent: 'center',
  },
  modalText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#000',
  marginBottom: 15,
  },
  buttonContainer: {
  marginTop:50,
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '100%',
  marginBottom: 20,
  },
  buttonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign:'center',
    },
  sectionnContainer: {
    marginTop: 10,
    marginBottom:30,
  },
  sectionContainer: {
    marginTop: 10,
    marginBottom:10,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000', // Adjust the color as needed
    flex: 1,
    marginBottom:10, // Allows the text to occupy maximum width
  },
  addEntryButton: {
    backgroundColor: '#fff',
    borderColor:'#000',
    borderWidth:0.2,
    borderRadius: 20, // Rounded corners
    padding: 10,
    alignItems: 'center', // Center text horizontally
    marginTop: 0, // Space from the last manual entry item
  },
  
  addEntryButtonText: {
    color: '#000', // Dark green text to contrast with light green background
    fontSize: 16,
  },
  recipeItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row', // Layout children horizontally
    alignItems: 'center', // Align items in the center vertically
    flexWrap: 'wrap', // Allow items to wrap to the next line
  },
  text: {
    color: '#fff', // Light green text to contrast with light green background
    fontSize: 16,
    fontWeight:'bold',
  },
  recipeTextContainer: {
    flex: 1, // Take up all available space
    minWidth: 0, // Allows shrinking below its content's intrinsic width
    paddingRight: 10, // Keeps some space to the right
  },
  recipeText: {
    color: 'black',
    fontWeight:'bold',
    fontSize:16,
    marginRight:10,
    flexWrap: 'wrap', // Allow the text to wrap
  },    
  manualEntryItem: {
    backgroundColor: '#fff',
    borderColor:'#000',
    borderWidth:0.2,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  manualEntryText: {
    color: '#000',
    flexWrap: 'wrap',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  signout: {
    backgroundColor:'red',
    marginBottom:50,
  },
  detailText: {
    color: '#000', // Dark color for text
    fontSize: 14, // Smaller font size for details
  },
  deleteIconButton: {
    alignSelf:'center', // This pushes the button to the right
    padding: 8, // Provides some space around the icon for easier tapping
  },  
  messageText: {
    fontSize: 12, // Small text size
    fontStyle: 'italic', // Italicize the text
    color: 'black', // Green text color
    textAlign: 'center', // Center the text
    marginTop: 20, // Add some space at the top
  },  
  infoText: {
    fontSize: 12, // Small text size
    fontStyle: 'italic', // Italicize the text
    color: 'black', // Green text color
    textAlign: 'left', // Center the text
    marginBottom: 10, // Add some space at the top
  },
  });
export default TrackingScreen;
