import React, { useState, useEffect } from "react"
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BiometryTypes } from 'react-native-biometrics'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEnrollment, resetDeviceBiometrics, storeUserName } from "./BiometricsAuthentication";
// import appData from '../../app.json';

export default function BiometricsEnrollView({ navigation, route }) {
  // const insets = useSafeAreaInsets();
  const [biometricsIcon, setBiometricsIcon] = useState('fingerprint');
  const [biometricType, setBiometricType] = useState<any>();
  const [apexData, setApexData] = useState<any>();

  const initEnrollment = async (apexData: any) => {
    const enrollment = await getEnrollment(apexData.promptMessage, apexData.username, apexData.cancelText, true);
    
    if(!enrollment.success) {
      await resetDeviceBiometrics();
      return -1;
    }

    await storeUserName(apexData.username);
    navigation.navigate('Home', {
      enrollment,
      action: 'biometrics-enroll-user',
    });
    return 1;
  }

  useEffect(() => {
    if (route.params?.biometricType) {
      setBiometricType(route.params?.biometricType);
      if (route.params.biometricType.name == BiometryTypes.FaceID)
        setBiometricsIcon('face-recognition');
      else
        setBiometricsIcon('fingerprint');
    }

    if (route.params?.apexData) {
      setApexData(route.params.apexData);
    }

    return;
  }, [route.params]);

  return (
    <View style={{...styles.container, paddingTop: 0/*insets.top*/}}>
      <StatusBar
        barStyle='light-content'
      />
      <View style={styles.header}>
        {/* <Icon name={biometricsIcon} size={120} color={appData.alternateColor} /> */}
        <Text style={styles.headerTitle}>
          Log In Faster on This Device
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>
          Trust in this device? You can quickly and securely log in the next time using this device's fingerprint or face recognition.
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.disclaimerText}>
          Your biometric information will not be collected by YOUR_APP_NAME and
          will be used locally for verification purposes only.
        </Text>
        <TouchableOpacity onPress={() => {
          initEnrollment(apexData)
            .then((status) => {
              console.log('Biometrics enrollment finished with status:', status);
              if (status == -1) navigation.navigate('Home');
            })
            .catch(async (e) => {
              console.log(e);
              await resetDeviceBiometrics();
              navigation.navigate('Home');
            });
        }}>
          <View style={styles.btnPrimary}>
            <Text style={{ color: '#FFF', fontSize: 20, }}>
              Enable Now
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => {
          navigation.navigate('Home', { action: 'biometrics-enroll-ask-later' });
        }}>
          <View style={styles.btnAlternative}>
            <Text style={{ /*color: appData.primaryColor,*/ fontSize: 20, }}>
              Maybe Later
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 20,
  },
  bodyText: {
    color: 'black',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 5,
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: 330,
  },
  btnAlternative: {
    alignItems: 'center',
    marginVertical: 5,
    paddingVertical: 15,
    width: 330,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  disclaimerText: {
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
  footer: {
    alignItems: 'center',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 60,
  },
  headerTitle: {
    color: 'black',
    fontSize: 26,
    marginVertical: 25,
  }
})