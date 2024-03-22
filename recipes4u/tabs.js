import * as React from 'react';
import { MaterialBottomTabNavigationProp, createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'react-native';
import TrackingScreen from './four';
import SearchScreen from './three';
import ShoppingListScreen from './shoppinglist';
import TabOne from './nflayout';

function TabOneScreen() {
    return <TabOne />; // Render as JSX element
  }
  
  function TabTwoScreen() {
    return <SearchScreen />; // Render as JSX element
  }
  
  function TabThreeScreen() {
    return <ShoppingListScreen />; // Render as JSX element
  }
  
  function TabFourScreen() {
    return <TrackingScreen />; // Render as JSX element
  }

// Navigator
const Tab = createMaterialBottomTabNavigator();

function MyTabs() {
  const colorScheme = useColorScheme();

  return (
<Tab.Navigator
  initialRouteName="TabOne"
  activeColor="green"
  inactiveColor="black"
  style={{ backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}
  barStyle={{ backgroundColor: 'white', height: '10%' }} // Set the height here
>
      <Tab.Screen
        name="TabOne"
        component={TabOneScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="TabTwo"
        component={TabTwoScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="search" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="TabThree"
        component={TabThreeScreen}
        options={{
          tabBarLabel: 'Shopping List',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="shopping-basket" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="TabFour"
        component={TabFourScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" color={color} size={26} />
          ),
        }}
      />      
    </Tab.Navigator>
  );
}

export default MyTabs;
