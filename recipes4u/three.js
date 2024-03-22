import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebaseconfig';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchquery, setSearchQuery] = useState('');
  const [selectedDietLabels, setSelectedDietLabels] = useState([]);
  const [selectedHealthLabels, setSelectedHealthLabels] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [selectedCuisineTypes, setSelectedCuisineTypes] = useState('');
  const [sortCriteria, setSortCriteria] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [results, setResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    dietLabels: ["Balanced","High-Fiber","High-Protein","Low-Carb","Low-Fat","Low-Sodium"],
    healthLabels: [
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
    "Kosher",
    "Low Potassium",
    "Low Sugar",
    "Lupine-Free",
    "Mollusk-Free",
    "Mustard-Free",
    "No oil added",
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
    "Wheat-Free"],
    cuisineTypes: [    "american",
    "asian",
    "british",
    "caribbean",
    "central europe",
    "chinese",
    "eastern europe",
    "french",
    "greek",
    "indian",
    "italian",
    "japanese",
    "korean",
    "mediterranean",
    "mexican",
    "middle eastern",
    "nordic",
    "south american",
    "south east asian"
  ],
    mealTypes: ["breakfast",
    "brunch",
    "lunch/dinner"],
    sortOptions: [
      { label: 'Calories per Serving', value: 'calories' },
      { label: 'Likes', value: 'likes' },
      { label: 'Cooks', value: 'cooks' },
      { label: 'Fats per Serving', value: 'fats' },
      { label: 'Carbs per Serving', value: 'carbs' },
      { label: 'Protein per Serving', value: 'protein' }
    ]
  });
  const [expandedSections, setExpandedSections] = useState({
    dietLabels: false,
    healthLabels: false,
    mealTypes: false,
    cuisineTypes: false,
  });

  const [recommended, setRecommended] = useState(false);
  const [goal, setGoal] = useState('');
  const db = getFirestore();

  useEffect(() => {
    // Fetch user's health labels from Firestore
    const fetchUserHealthLabels = async () => {
      const userDocRef = doc(db, 'useronboarding', auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setSelectedHealthLabels(userData.healthLabels || []);
      } else {
        console.log("No such document!");
      }
    };

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
    
       setGoal(userGoal); // Return the goal string
    }

    fetchUserHealthLabels();
  }, []);

  const handleSearch = () => {
    setErrorMessage('');
    setIsSearching(true); 
    fetch('http://your.network.ip.address:3002/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchquery,
        dietLabels: selectedDietLabels,
        healthLabels: selectedHealthLabels,
        cuisineTypes: selectedCuisineTypes,
        mealTypes: selectedMealType,  
        sort: { [sortCriteria]: sortOrder === 'asc' ? 1 : -1 },
        recommended,
        userId: auth.currentUser.uid,
        goal,
      }),
    })
      .then(response => response.json())
      .then(data => {
        setIsSearching(false); // Stop searching
        if (data && data.length > 0) {
          setResults(data);
        } else {
          setErrorMessage('No recipes found.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setErrorMessage('Failed to perform search.');
        setIsSearching(false); // Stop searching even if there's an error
      });
  };  

  const toggleSelection = (item, setSelected, selected) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(s => s !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const Checkbox = ({ label, setSelected, selected }) => {
    const isChecked = selected.includes(label);
    return (
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleSelection(label, setSelected, selected)}>
        <View style={[styles.checkbox, isChecked ? styles.checkboxChecked : null]}>
          {isChecked && <Text style={styles.checkboxCheckmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const toggleSection = (section) => {
    setExpandedSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section],
    }));
  };

  const CustomButton = ({ title, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.customButton}>
    <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search recipes..."
        placeholderTextColor="#777"
        value={searchquery}
        onChangeText={setSearchQuery}
      />

    <TouchableOpacity onPress={() => toggleSection('dietLabels')} style={styles.sectionHeader}>
      <Text style={styles.label}>{expandedSections.dietLabels ? '- ' : '+ '}Diet Labels</Text>
    </TouchableOpacity>
    {expandedSections.dietLabels && filterOptions.dietLabels.map((label, index) => (
      <Checkbox key={index} label={label} setSelected={setSelectedDietLabels} selected={selectedDietLabels} />
    ))}

    <TouchableOpacity onPress={() => toggleSection('mealTypes')} style={styles.sectionHeader}>
      <Text style={styles.label}>{expandedSections.mealTypes ? '- ' : '+ '}Meal</Text>
    </TouchableOpacity>
    {expandedSections.mealTypes && filterOptions.mealTypes.map((label, index) => (
      <Checkbox key={index} label={label} setSelected={setSelectedMealType} selected={selectedMealType} />
    ))}

    <TouchableOpacity onPress={() => toggleSection('cuisineTypes')} style={styles.sectionHeader}>
      <Text style={styles.label}>{expandedSections.cuisineTypes ? '- ' : '+ '}Cuisines</Text>
    </TouchableOpacity>
    {expandedSections.cuisineTypes && filterOptions.cuisineTypes.map((label, index) => (
      <Checkbox key={index} label={label} setSelected={setSelectedCuisineTypes} selected={selectedCuisineTypes} />
    ))}

<TouchableOpacity onPress={() => toggleSection('healthLabels')} style={styles.sectionHeader}>
      <Text style={styles.label}>{expandedSections.healthLabels ? '- ' : '+ '}Restrictions</Text> 
    </TouchableOpacity>
    {expandedSections.healthLabels && (
    <Text style={styles.italicText}>All selections will be met</Text>
    )}
    {expandedSections.healthLabels && filterOptions.healthLabels.map((label, index) => (
    <Checkbox key={index} label={label} setSelected={setSelectedHealthLabels} selected={selectedHealthLabels} />
    ))}

<View style={styles.sectionnHeader}>
  <Text style={styles.label}>Featured <Text style={styles.flameIcon}>🔥</Text></Text>
</View>
<TouchableOpacity
  style={styles.checkboxContainer}
  onPress={() => setRecommended(!recommended)}>
  <View style={[styles.checkboxx, recommended ? styles.checkboxxChecked : null]}>
    {recommended && <Text style={styles.checkboxCheckmark}>✓</Text>}
  </View>
  <Text style={styles.featuredLabel}>Recommended For You<Text style={styles.flameIcon}>🔥</Text></Text>
</TouchableOpacity>


<RNPickerSelect
  onValueChange={(value) => setSortCriteria(value)}
  items={filterOptions.sortOptions}
  placeholder={{ label: "Select Sort Criteria", value: null }}
  style={pickerSelectStyles}
/>
      <RNPickerSelect
        onValueChange={(value) => setSortOrder(value)}
        items={[
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ]}
        placeholder={{ label: "Select Sort Order", value: null }}
        style={pickerSelectStyles}
      />

{
  isSearching ? (
    <Text style={{ color: "#4CAF50", margin: 10, textAlign: "center" }}>Searching...</Text>
  ) : (
    <CustomButton title="Search" onPress={handleSearch} />
  )
}

      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : (
        results.map((recipe, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.resultItem} 
            onPress={() => navigation.navigate('Details', { recipe: recipe.recipe })}>
            <Image source={{ uri: recipe.recipe.image }} style={styles.recipeImage} />
            <Text style={styles.recipeLabel} numberOfLines={1} ellipsizeMode="tail">{recipe.recipe.label}</Text>
          </TouchableOpacity>
        ))        
      )}
    </ScrollView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    color: 'green',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#fff',
    marginBottom: 20,
    marginLeft:5,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'black',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#fff',
    marginBottom: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor:'#fff',
  },
  italicText: {
    fontStyle: 'italic',
    color: 'red', // Adjust the color to match your checklist items
    marginLeft: 5,
    marginBottom: 10, // Provide some spacing before the checklist starts
  },  
  input: {
    height: 50,
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  checkbox: {
    minWidth: 20,
    minHeight: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 3,
    marginLeft:5, // Rounded corners for checkbox
  },
  checkboxx: {
    minWidth: 20,
    minHeight: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderWidth: 1,
    borderRadius: 3,
    marginLeft:5, // Rounded corners for checkbox
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50', // Change as needed
  },
  checkboxxChecked: {
    backgroundColor: 'green', // Change as needed
  },
  checkboxCheckmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: 'black',
  },
  label: {
    color: '#000',
    marginTop: 10,
    marginBottom: 10,
    marginLeft:5,
    fontWeight: 'bold',
  },
  errorMessage: {
    color: 'red',
    marginTop: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    overflow:'hidden',
    padding: 10,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  recipeLabel: {
    color: 'black',
    fontWeight: 'bold',
    flexShrink: 1, // allow the text to shrink if needed
    maxWidth: '80%', 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: '#fff', // Light grey to make it stand out a bit
    borderRadius: 10,
    borderColor:'black',
    borderWidth:1,
    marginVertical: 5,
    marginLeft:5,
    alignItems: 'center',
  },
  sectionnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: '#e8f5e9', // Light grey to make it stand out a bit
    borderRadius: 10,
    marginVertical: 5,
    marginLeft:5,
    alignItems: 'center',
  },
  customButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
    },
    featuredHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    flameIcon: {
      fontSize: 16, // Adjust size as needed
    },
    featuredLabel: {
      color: '#000',
      marginLeft: -5, // Adjust spacing as needed
    },
});

export default SearchScreen;
