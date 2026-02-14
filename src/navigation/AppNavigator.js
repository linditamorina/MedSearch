import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen'; 
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import SchedulesScreen from '../screens/SchedulesScreen'; // Kontrollo që ky file ekziston në screens/

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} /> 
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Schedules" component={SchedulesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}