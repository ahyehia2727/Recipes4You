const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
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

const app = express();
const PORT = 3002;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Recipes', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.post('/api/search', async (req, res) => {
    try {
      const { searchquery, dietLabels, healthLabels, cuisineTypes, mealTypes, sort, recommended, userId,goal } = req.body;
  
      let searchOptions = {};
  
      if (searchquery) {
        searchOptions['$text'] = { $search: searchquery };
      }
  
      if (dietLabels && dietLabels.length) {
        searchOptions['recipe.dietLabels'] = { $in: dietLabels };
      }
  
      if (healthLabels && healthLabels.length) {
        searchOptions['recipe.healthLabels'] = { $all: healthLabels };
      }
  
      if (cuisineTypes && cuisineTypes.length) {
        searchOptions['recipe.cuisineType'] = { $in: cuisineTypes };
      }
  
      if (mealTypes && mealTypes.length) {
        searchOptions['recipe.mealType'] = { $in: mealTypes };
      }

      let useGoalFiltering = false;

      if (recommended && userId) {
        const data = await fs.readFile('user_recommendations_for_search.json', 'utf8');
        const recommendations = JSON.parse(data);
  
        if (recommendations[userId] && recommendations[userId].length) {
          const userRecommendedUrls = recommendations[userId];
          searchOptions['recipe.url'] = { $in: userRecommendedUrls };
        } else {
          // No recommendations found for the user; use goal filtering if goal is provided
          useGoalFiltering = true;
        }
      } else if (recommended) {
        // Recommended is true but no userId provided; use goal filtering if goal is provided
        useGoalFiltering = true;
      }
  
      // Apply goal-based filtering if needed
      if (useGoalFiltering && goal) {
        switch(goal) {
          case 'extreme_weight_loss':
            searchOptions['recipe.dietLabels'] = { $all: ["Low-Carb", "Low-Fat"] };
            break;
          case 'weight_loss':
            searchOptions['recipe.dietLabels'] = { $all: ["Low-Carb"] };
            break;
          case 'muscle_building':
            searchOptions['recipe.dietLabels'] = { $all: ["High-Protein"] };
            break;
        }
      }
  
      let recipes;
      if (searchquery) {
        recipes = await Recipe.find(searchOptions, { score: { $meta: "textScore" } })
                              .sort({ score: { $meta: "textScore" } })
                              .limit(30);
      } else {
        recipes = await Recipe.find(searchOptions).limit(30);
      }
  
      // Comprehensive in-memory sorting based on specified sort criteria
      if (sort && Object.keys(sort).length > 0) {
        recipes = recipes.sort((a, b) => {
          for (let key in sort) {
            let direction = sort[key] === -1 ? -1 : 1;
            switch (key) {
              case 'likes':
                if (a.recipe.likesCount !== b.recipe.likesCount) {
                  return direction * (a.recipe.likesCount - b.recipe.likesCount);
                }
                break;
              case 'cooks':
                if (a.recipe.cookCount !== b.recipe.cookCount) {
                  return direction * (a.recipe.cookCount - b.recipe.cookCount);
                }
                break;
              case 'calories':
                if (a.recipe.calories !== b.recipe.calories) {
                  return direction * (a.recipe.calories - b.recipe.calories);
                }
                break;
              case 'time':
                if (a.recipe.totalTime !== b.recipe.totalTime) {
                  return direction * (a.recipe.totalTime - b.recipe.totalTime);
                }
                break;
              case 'fats':
                let aFats = a.recipe.digest.find(d => d.tag === 'FAT').total;
                let bFats = b.recipe.digest.find(d => d.tag === 'FAT').total;
                if (aFats !== bFats) {
                  return direction * (aFats - bFats);
                }
                break;
              case 'carbs':
                let aCarbs = a.recipe.digest.find(d => d.tag === 'CHOCDF').total;
                let bCarbs = b.recipe.digest.find(d => d.tag === 'CHOCDF').total;
                if (aCarbs !== bCarbs) {
                  return direction * (aCarbs - bCarbs);
                }
                break;
              case 'protein':
                let aProtein = a.recipe.digest.find(d => d.tag === 'PROCNT').total;
                let bProtein = b.recipe.digest.find(d => d.tag === 'PROCNT').total;
                if (aProtein !== bProtein) {
                  return direction * (aProtein - bProtein);
                }
                break;
            }
          }
          return 0;
        });
      }
  
      res.json(recipes);
    } catch (error) {
      res.status(500).send(error.toString());
      console.log(error.toString());
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
