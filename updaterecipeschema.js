const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Recipes')
.then(() => console.log('Connected to MongoDB...'))
.catch(err => console.error('Could not connect to MongoDB...', err));

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
    cookCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    reviews: [reviewSchema]
  }, { _id: false });
  
  const mainRecipeSchema = new Schema({
    recipe: recipeDetailsSchema
  });

  const Recipe = mongoose.model('Recipe', mainRecipeSchema);

  async function updateRecipeSchema() {
    try {
      const recipes = await Recipe.find(); // Finds all recipes in the collection
      await Promise.all(recipes.map(async (recipe) => {
        // Update each recipe with initial values for new fields
        return Recipe.findByIdAndUpdate(recipe._id, {
          $set: {
            "recipe.likesCount": recipe.recipe.likesCount || 0,
            "recipe.dislikesCount": recipe.recipe.dislikesCount || 0,
            "recipe.cookCount": recipe.recipe.cookCount || 0,
          }
        }, { new: true, upsert: true }); // upsert: true creates the document if it does not exist
      }));
      console.log('All recipes updated successfully.');
    } catch (error) {
      console.error('Error updating recipes:', error);
    } finally {
      mongoose.disconnect();
    }
  }  

updateRecipeSchema().then(() => mongoose.disconnect());


