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

const updateIngredients = async () => {
  try {
    const recipes = await Recipe.find({}); // Fetch all recipes

    for (let recipe of recipes) {
      // Check if the recipe has ingredients to update
      if (recipe.recipe.ingredients && recipe.recipe.ingredients.length > 0) {
        // Map through each ingredient for transformations
        const updatedIngredients = recipe.recipe.ingredients.map(ingredient => {
          // Convert 'food' to lowercase
          if (ingredient.food) {
            ingredient.food = ingredient.food.toLowerCase();
            // Replace '-' with a space
            ingredient.food = ingredient.food.replace(/-/g, ' ');
            // Remove the last 's' from the last word if it ends with 's'
            const words = ingredient.food.split(' ');
            const lastWordIndex = words.length - 1;
            if (words[lastWordIndex].endsWith('s')) {
              words[lastWordIndex] = words[lastWordIndex].slice(0, -1);
            }
            ingredient.food = words.join(' ');
          }
          return ingredient;
        });

        // Save the updated recipe document with transformed ingredient 'food' fields
        recipe.recipe.ingredients = updatedIngredients;
        await recipe.save();
      }
    }

    console.log('Ingredient fields have been updated.');
  } catch (error) {
    console.error('An error occurred during processing:', error);
  }
};

// Call the function to start the update process
updateIngredients();
