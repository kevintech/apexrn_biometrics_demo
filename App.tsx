import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ApexView from './src/components/ApexView';
import BiometricsEnrollView from './src/components/BiometricsEnrollmentView';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {

  useEffect(() => {
    console.log('App loaded');
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator mode="modal" initialRouteName='Home'>
        <Stack.Screen name="Home"
          component={ApexView}
          options={({ navigation, route }) => ({
            headerShown: false,
          })}
        />
        <Stack.Screen name="BiometricsEnrollment"
          component={BiometricsEnrollView}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
