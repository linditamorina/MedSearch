import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importet e Context dhe Supabase
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import { supabase } from "./src/lib/supabase";

// Importet e Ekraneve
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import DetailsScreen from "./src/screens/DetailsScreen";
import SchedulesScreen from "./src/screens/SchedulesScreen"; // Ekrani i ri i orareve

// Injorojmë njoftimet që nuk janë kritike
LogBox.ignoreLogs([
  'setLayoutAnimationEnabledExperimental',
  'SafeAreaView has been deprecated'
]);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const theme = useTheme();
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: "#3498db",
        tabBarInactiveTintColor: theme.subText,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "search";
          else if (route.name === "Favorites") iconName = "heart";
          else if (route.name === "Plan") iconName = "calendar"; // Ikona për oraret
          else if (route.name === "Profile") iconName = "person";
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: t("home") || "Search" }} 
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ tabBarLabel: t("favorites") || "Favorites" }} 
      />
      <Tab.Screen 
        name="Plan" 
        component={SchedulesScreen} 
        options={{ tabBarLabel: t("plan") || "Plan" }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: t("profile") || "Profile" }} 
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kontrollojmë sesionin fillestar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Dëgjojmë ndryshimet e login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}