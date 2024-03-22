import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, FlatList, StyleSheet, Image, ScrollView,Alert,TouchableOpacity,Modal,CheckBox } from 'react-native';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp,deleteDoc,doc } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Ensure this is correctly pointed to your Firebase config
import { useFocusEffect } from '@react-navigation/native'; 
import FontAwesome from '@expo/vector-icons/FontAwesome';

const ShoppingListScreen = () => {
  const [searchquery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    fetchShoppingList();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchShoppingList();
      return () => {
        // Optional: Any cleanup actions go here
      };
    }, [])
  );

  const handleSearch = () => {
    setErrorMessage('');
    fetch(`http://your.network.ip.address:3006/search?query=${searchquery}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          setIngredients(data);
        } else {
          setErrorMessage('No ingredients found.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setErrorMessage('Failed to perform search.');
      });
  };

  const addToShoppingList = async (item) => {
    const q = query(
      collection(db, 'shoppinglists'),
      where('userId', '==', auth.currentUser.uid),
      where('item', '==', item.food)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      Alert.alert('Item already exists in the shopping list.');
      return;
    }
  
    try {
      await addDoc(collection(db, 'shoppinglists'), {
        userId: auth.currentUser.uid,
        item: item.food,
        category: item.foodCategory,
        image: item.image,
        timestamp: serverTimestamp()
      });
      fetchShoppingList();
    } catch (error) {
      console.error('Error adding item to shopping list: ', error);
    }
  };  

  const fetchShoppingList = async () => {
    const q = query(collection(db, 'shoppinglists'), where('userId', '==', auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    const listItems = [];
    querySnapshot.forEach((doc) => {
      listItems.push(doc.data());
    });
    // Group items by category
    const groupedItems = listItems.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {});
    setShoppingList(groupedItems);
    const categories = [...new Set(listItems.map(item => item.category))];
    const sortedCategories = categories.sort();
    setFilterCategories(sortedCategories);
  };

  const deleteFromShoppingList = async (itemName) => {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          const q = query(
            collection(db, 'shoppinglists'),
            where('userId', '==', auth.currentUser.uid),
            where('item', '==', itemName)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((document) => {
            deleteDoc(doc(db, 'shoppinglists', document.id));
          });
          fetchShoppingList(); // Refresh the list after deletion
        },
      },
    ]);
  };

  const handleDone = () => {
    setIngredients([]);
    setSearchQuery('');
  };

  const handleCategorySelect = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(item => item !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const applyFilters = () => {
    setIsModalVisible(false);
  };

  const handleResetCategories = () => {
    setSelectedCategories([]);
  };  

  const capitalize = (str) => str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search ingredients to add..."
        value={searchquery}
        onChangeText={setSearchQuery}
      />
    <Text style={styles.infoText}>
      Click 'Done' to close search results and reset search bar.
    </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.doneButton]} onPress={handleDone}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {ingredients.length > 0 && (
          <Text style={styles.sectionTitle}>Search Results:</Text>
        )}
        {ingredients.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={styles.placeholderImage}></View>
            )}
            <Text style={styles.text}>{capitalize(`${item.food} - ${item.foodCategory}`)}</Text>
            <TouchableOpacity onPress={() => addToShoppingList(item)} style={styles.addButtonContainer}>
              <Text style={styles.addButton}>Add to List</Text>
            </TouchableOpacity>
          </View>
        ))}
<View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: 10, marginVertical: 10 }}>
  <Text style={styles.sectionTitle}>Shopping List</Text>
  <TouchableOpacity
    onPress={Object.keys(shoppingList).length !== 0 ? () => setIsModalVisible(true) : null}
    style={Object.keys(shoppingList).length !== 0 ? styles.filterButtonEnabled : styles.filterButtonDisabled}
  >
    <FontAwesome name="filter" size={24} color={Object.keys(shoppingList).length !== 0 ? "green" : "grey"} />
    <Text style={{ color: Object.keys(shoppingList).length !== 0 ? "green" : "grey", marginTop: 5, fontWeight: 'bold' }}> Filter</Text>
  </TouchableOpacity>
</View>
{Object.keys(shoppingList).length === 0 && (
  <Text style={styles.emptyMessageStyle}>Your shopping list is empty! Search ingredients to add or add them automatically through a recipe.</Text>
)}
        {Object.keys(shoppingList).filter(category => selectedCategories.length === 0 || selectedCategories.includes(category)).map((category) => (
          <View key={category}>
            <Text style={styles.categoryHeader}>{capitalize(category)}</Text>
            {shoppingList[category].map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <View style={styles.placeholderImage}></View>
                )}
                <Text style={styles.text}>{capitalize(item.item)}</Text>
                <TouchableOpacity onPress={() => deleteFromShoppingList(item.item)}>
                  <FontAwesome name="trash" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

      <Modal
  animationType="slide"
  transparent={true}
  visible={isModalVisible}
  onRequestClose={() => {
    setIsModalVisible(!isModalVisible);
  }}
>
  <View style={styles.centeredView}>
    <View style={styles.modalView}>
      {/* Title for the Modal */}
      <Text style={styles.modalTitle}>Filter by Category</Text>
      <TouchableOpacity
          style={styles.modalButton}
          onPress={handleResetCategories}
        >
          <FontAwesome name="refresh" size={24} color="green" />
        </TouchableOpacity>
      <ScrollView style={{width: '100%'}}>
        {filterCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}
            onPress={() => handleCategorySelect(category)}
          >
            <View
              style={{
                height: 20,
                width: 20,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#000',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              {selectedCategories.includes(category) && (
                <View
                  style={{
                    height: 12,
                    width: 12,
                    borderRadius: 3,
                    backgroundColor: 'green',
                  }}
                />
              )}
            </View>
            {/* Capitalize category name */}
            <Text style={{ fontSize: 16, color:'black' }}>{capitalize(category)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={{
          backgroundColor: '#4CAF50',
          padding: 10,
          borderRadius: 5,
          marginTop: 5,
          marginBottom:-15,
          alignItems: 'center',
        }}
        onPress={() => setIsModalVisible(false)}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalTitle: {
    marginTop:0,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color:'black', // Adjust as needed
  },
  modalButton: {
    backgroundColor: '#fff',
    padding: 0,
    borderRadius: 5,
    marginTop: 0,
    marginBottom:5,
    minWidth: 100, // Adjust as needed
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalView: {
    height:'35%',
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
    justifyContent: 'center',
  },
  addButtonContainer: { // New style for 'Add to List' button
    backgroundColor: 'green', // Darker green shade for theme consistency
    padding: 8,
    borderRadius: 5,
  },
  addButton: { // Updated 'Add to List' button text styling
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    backgroundColor: '#ffffff',
    borderColor: '#e8e8e8',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  doneButton: {
    backgroundColor: '#ecba4e',
    marginLeft: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    marginRight: 15,
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
  deleteText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: 'red',
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color:'#000'
  },
  categoryContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    textAlign:'center',
    marginBottom: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyMessageStyle: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: 'green',
    fontSize: 14, // Adjust the size as needed
    marginVertical: 20, // Adjust spacing as needed
  },  
  filterButtonDisabled: {
    marginBottom:9,
    opacity: 0.5,
    flexDirection: 'row', // Example: make it half transparent to indicate it's disabled
  },
  filterButtonEnabled: {
    marginBottom:9,
    flexDirection: 'row', // Example: make it half transparent to indicate it's disabled
  },
  infoText: {
    fontSize: 12, // Small text size
    fontStyle: 'italic', // Italicize the text
    color: 'black', // Green text color
    textAlign: 'left', // Center the text
    marginBottom: 10, // Add some space at the top
  },
});

export default ShoppingListScreen;
