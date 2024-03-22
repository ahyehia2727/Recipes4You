import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';

const SimilarRecipesScreen = ({ navigation, route }) => {
  const { recipes } = route.params;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => navigation.navigate('Details', { recipe: item })}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.recipeImage} />
      )}
      <View style={styles.recipeTextContainer}>
        <Text style={styles.recipeTitle}>{item.label}</Text>
        <Text style={styles.similarityText}>{`${(item.cosineSimilarity * 100).toFixed(1)}% similarity`}</Text>
      </View>
    </TouchableOpacity>
  );  

  return (
    <FlatList
      data={recipes}
      renderItem={renderItem}
      keyExtractor={item => item.uri}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  recipeItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
    alignItems: 'center',
  },
  recipeImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  recipeTitle: {
    fontSize: 17,
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: 'bold',
    color: 'black',
  },
  recipeTextContainer: {
    flex: 1,
    flexDirection: 'column', // Ensure text is vertically aligned in a column
  },
  similarityText: {
    fontSize: 14,
    color:'green',
  }
});

export default SimilarRecipesScreen;
