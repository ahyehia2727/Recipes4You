const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Recipes', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

  const { Schema } = mongoose;
  const reviewSchema = new mongoose.Schema({
    user_id: String,
    review_text: String,
    review_sentiment: Number,
    timestamp: { type: Date, default: Date.now },
  }, { _id: false });
  
  const ingredientSchema = new Schema({
    text: String,
    quantity: Number,
    measure: String,
    food: String,
    weight: Number,
    foodCategory: String,
    foodId: String,
    image: String
  }, { _id: false });
  
  const nutrientSchema = new Schema({
    label: String,
    quantity: Number,
    unit: String
  }, { _id: false });
  
  const digestSubSchema = new Schema({
    label: String,
    tag: String,
    schemaOrgTag: String,
    total: Number,
    hasRDI: Boolean,
    daily: Number,
    unit: String,
    sub: [nutrientSchema]
  }, { _id: false });
  
  const recipeDetailsSchema = new Schema({
    uri: String,
    label: String,
    image: String,
    source: String,
    url: String,
    shareAs: String,
    yield: Number,
    dietLabels: [String],
    healthLabels: [String],
    cautions: [String],
    ingredientLines: [String],
    ingredients: [ingredientSchema],
    calories: Number,
    totalWeight: Number,
    totalTime: Number,
    cuisineType: [String],
    mealType: [String],
    dishType: [String],
    totalNutrients: Schema.Types.Mixed,
    totalDaily: Schema.Types.Mixed,
    digest: [digestSubSchema],
    instructionLines: [String],
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    cookCount: { type: Number, default: 0 },
    reviews: [reviewSchema]
  }, { _id: false });
  
  const mainRecipeSchema = new Schema({
    recipe: recipeDetailsSchema
  });

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

// Function to count ingredients and sort them by occurrence
const countSortIngredientsIncludeCategory = async () => {
    try {
      const recipes = await Recipe.find({});
      const ingredientDetails = {};
  
      recipes.forEach(recipe => {
        recipe.recipe.ingredients.forEach(({ food, foodCategory }) => {
          if (ingredientDetails[food]) {
            ingredientDetails[food].count += 1; // Increment count if already exists
          } else {
            ingredientDetails[food] = { count: 1, category: foodCategory }; // Initialize if new
          }
        });
      });
  
      // Convert to an array, sort by count, and remap to include food, count, and category
      const sortedIngredientsWithCategory = Object.entries(ingredientDetails)
        .sort((a, b) => b[1].count - a[1].count) // Sort by count in descending order
        .map(([food, details]) => ({
          food,
          count: details.count,
          category: details.category // Include the category in the output
        }));
  
      // Write to a JSON file
      fs.writeFile('sortedIngredientsCounts.json', JSON.stringify(sortedIngredientsWithCategory, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('An error occurred:', err);
          return;
        }
  
        console.log('File has been saved with ingredients sorted by count and including categories.');
      });
    } catch (error) {
      console.error('An error occurred during processing:', error);
    }
  };
  
  // Call the function to start the process
  countSortIngredientsIncludeCategory();
