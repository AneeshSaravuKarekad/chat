import { StyleSheet, View, LogBox, ActivityIndicator } from "react-native";

// Navigation imports
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { onAuthStateChanged } from "firebase/auth";
// Custom module imports
import { Chat, Start } from "./components";
import useAuth, { AuthProvider } from "./utils/AuthProvider";
import { auth } from "./config/firebase";
import { useState, useEffect } from "react";

LogBox.ignoreLogs(["AsyncStorage"]);

const RootNavigator = () => {
  const Stack = createStackNavigator();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { uid, error } = useAuth();

  useEffect(() => {
    if (!error) {
      setIsLoading(false);
    }
  }, [uid, error]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start" component={Start} />
        <Stack.Screen name="Chat" component={Chat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
