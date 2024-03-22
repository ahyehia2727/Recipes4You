import React, { useState, useEffect } from 'react';

function RecipeComponent() {
  const [recipeData, setRecipeData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch('/api/recipe')
      .then(response => response.json())
      .then(data => setRecipeData(data))
      .catch(error => console.error('Error:', error));
  }, []);

  const renderDetails = () => {
    if (!recipeData || !recipeData.recipe) return null;
    const { recipe } = recipeData;

    return (
      <div>
        <p>Source: {recipe.source}</p>
        <p>Calories: {recipe.calories}</p>
        <p>Ingredients:</p>
        <ul>
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient.text}</li>
          ))}
        </ul>
        {/* Add other details as needed */}
      </div>
    );
  };

  return (
    <div>
      {recipeData && recipeData.recipe && (
        <div>
          <button onClick={() => setShowDetails(!showDetails)}>
            <img src={recipeData.recipe.image} alt={recipeData.recipe.label} />
            <p>{recipeData.recipe.label}</p>
          </button>
          {showDetails && renderDetails()}
        </div>
      )}
    </div>
  );
}

export default RecipeComponent;
