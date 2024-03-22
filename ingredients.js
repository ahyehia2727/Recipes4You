const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Recipes', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the Recipe Schema and Model
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
  reviews: [reviewSchema]
}, { _id: false });

const mainRecipeSchema = new Schema({
  recipe: recipeDetailsSchema
});

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

// Function to extract, de-duplicate ingredients, and include the "image" field
const extractAndSaveIngredients = async () => {
  try {
    const recipes = await Recipe.find({}); // Fetch all recipes
    const uniqueIngredients = {};

    recipes.forEach(recipe => {
      recipe.recipe.ingredients.forEach(({ food, foodCategory, image }) => {
        // Store both foodCategory and image if not already present
        if (!uniqueIngredients[food]) {
          uniqueIngredients[food] = { foodCategory, image };
        }
      });
    });

    // Prepare the data for writing to a file, including the "image" field
    const ingredientsForFile = Object.entries(uniqueIngredients).map(([food, { foodCategory, image }]) => ({
      food,
      foodCategory,
      image // Include the image in the output
    }));

    // Write to a JSON file
    fs.writeFile('uniqueIngredients.json', JSON.stringify(ingredientsForFile, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('An error occurred:', err);
        return;
      }

      console.log('File has been saved with unique ingredients and images.');
    });
  } catch (error) {
    console.error('An error occurred during processing:', error);
  }
};

// Call the function to start the extraction process
extractAndSaveIngredients();
