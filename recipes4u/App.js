window.navigator.userAgent = "ReactNative"; 

import React from 'react';
import { NavigationContainer,DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from './signin';
import SignUpScreen from './signup';
import MyTabs from './tabs';
import PasswordReset from './forgotPass';
import RecipeDetailScreen from './recipedetails';
import MissingIngredientsScreen from './MissingIngredients';
import SimilarRecipesScreen from './SimilarRecipes';
import RecipeInstructionsScreen from './RecipeInstructions';
import AllergyChecklistScreen from './onboarding1';
import DietSpecificationScreen from './onboarding2';
import CalculatorScreen from './onboarding3';
import InteractionsScreen from './ViewRecipes';
import RecipeReviewsScreen from './recipereviews';

const Stack = createNativeStackNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'green', // Use the hex code for the green color from your logo
    background: 'white',
    card: 'green', // Or any other suitable color
    text: 'white',
    border: 'green',
  },
};

const App = () => {
  return (
    <>
      <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: 'white', // Use the hex code for your theme color
          },
          headerTintColor: 'black',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: "Back", // This line sets the back button label to "Back" for all screens
        }}
      >
          <Stack.Screen name="Sign In" component={SignInScreen} />
          <Stack.Screen name="Password Reset" component={PasswordReset} />
          <Stack.Screen name="Sign Up" component={SignUpScreen} />
          <Stack.Screen name="Enter Your Allergies" component={AllergyChecklistScreen} />
          <Stack.Screen name="Diet Restrictions" component={DietSpecificationScreen} />
          <Stack.Screen name="Physical Metrics" component={CalculatorScreen} />
          <Stack.Screen name="Recipes4You" component={MyTabs} />
          <Stack.Screen name="Similar Recipes" component={SimilarRecipesScreen} />
          <Stack.Screen name="Details" component={RecipeDetailScreen} />
          <Stack.Screen name="Missing Ingredients" component={MissingIngredientsScreen} />
          <Stack.Screen name="Instructions" component={RecipeInstructionsScreen} />
          <Stack.Screen name="View Recipes" component={InteractionsScreen} />
          <Stack.Screen name="Reviews" component={RecipeReviewsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;

