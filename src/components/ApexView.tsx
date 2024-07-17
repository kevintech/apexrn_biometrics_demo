import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { getBiometricType, getSignature, isBiometricSupported, isDeviceEnrolled, resetDeviceBiometrics } from './BiometricsAuthentication';
import en from './../i18n/locales/en';

export default function ApexView({ navigation, route }) {
  const webref = React.useRef<WebView>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const [pubKey, setPubKey] = useState('');

  /**
   * Retrieves the Public Key from AsyncStorage
   */
  const pullPublicKey = async() => {
    try {
      const pubKey = await AsyncStorage.getItem('@publicKey');
      if (pubKey !== null) {
        setPubKey(pubKey);
      }
    } catch (e) {
      // saving error
    }
  }

  /**
   * Listening to Navigation Events
   */
  React.useEffect(() => {
    if (!webref || !webref.current) return;

    if (route.params?.action == 'biometrics-enroll-user' && route.params?.enrollment) {
      const enrollment = route.params.enrollment;
      const jsInjectApexEvent = `
      apex.event.trigger(window, 'vis-biometrics-enroll-user', {
        public_key: '${enrollment.publicKey}',
        signature: '${enrollment.signature}'
      });
      `;
      webref.current.injectJavaScript(jsInjectApexEvent);
      console.log('Biometrics enrollment triggered',jsInjectApexEvent);
      pullPublicKey();
    }
    else if (route.params?.action == 'biometrics-enroll-ask-later') {
      const jsInjectApexEvent = `
      apex.event.trigger(window, 'vis-biometrics-enroll-ask-later');
      `;
      webref.current.injectJavaScript(jsInjectApexEvent);
    }
    
  }, [route.params]);

  React.useEffect(() => {
    pullPublicKey()
      .then(() => console.log('Biometrics public key retrieved...'))
      .catch((e) => console.log(e));
  }, []);

  /**
   * Initiate Biometrics Authentication Flow
   * @param apexData Biometrics Prompt Message customization
   * @returns triggers authentication successfull or enrollment error
   */
  const initAuthentication = async (apexData: any) => {
    if (!webref || !webref.current) return 0;

    if (!pubKey || ! await isDeviceEnrolled()) {
      console.info(en.errors.biometrics_not_enrolled);
      const jsInjectApexEvent = `
      apex.event.trigger(window, 'vis-biometrics-not-enrolled');
      `;
      webref.current.injectJavaScript(jsInjectApexEvent);
      return 0;
    }
    else {
      const biometricType = await getBiometricType();
      const jsInjectApexEvent = `
      apex.event.trigger(window, 'vis-biometrics-auth-type', {
        displayName: '${biometricType?.displayName}',
        name: '${biometricType?.name}'
      });
      `;
      webref.current.injectJavaScript(jsInjectApexEvent);
    }

    const challenge = '';
    const sign = await getSignature(apexData.promptMessage, challenge, apexData.cancelText);
    if(!sign.success) {
      console.info(en.errors.biometrics_signature_creation);
      const jsInjectApexEvent = `
      apex.event.trigger(window, 'vis-biometrics-auth-error', '${en.errors.biometrics_auth_error}');
      `;
      webref.current.injectJavaScript(jsInjectApexEvent);
      return -1;
    }

    const jsInjectApexEvent = `
    apex.event.trigger(window, 'vis-biometrics-auth-user', {
      public_key: '${pubKey}',
      signature: '${sign.signature}'
    });
    `;
    
    console.log('Biometrics authentication data:', jsInjectApexEvent);
    webref.current.injectJavaScript(jsInjectApexEvent);
    return 1;
  }

  /**
   * Initiate Biometrics Enrollment Flow
   * @param apexData Enrollment prompt and screen customization
   */
  const initEnrollment = async (apexData: any) => {
    if (!pubKey && await isBiometricSupported()) {
      let biometricType = await getBiometricType();
      navigation.navigate('BiometricsEnrollment', { biometricType, apexData });
    }
    else {
      console.info(en.errors.biometrics_device_enrolled);
    }
  }

  /**
   * APEX WebView Events Handler
   * @param event Data received from APEX events
   * @returns 
   */
  const webviewOnMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;

    if (event && data) {
      console.log('===== WebView onMessage =====', data);
      let apexData = JSON.parse(data);

      switch(apexData.action) {
        case 'vis-biometrics-enrollment': {
          initEnrollment(apexData);
          break;
        }
        case 'vis-biometrics-authentication': {
          initAuthentication(apexData)
            .then((status) => console.info('Biometrics authentication finished with status:', status))
            .catch((e) => console.log(e));
          break;
        }
        case 'vis-biometrics-check-enrollment': {
          isDeviceEnrolled()
          .then((isEnrolled) => {
            if (!webref || !webref.current) return;

            if (isEnrolled) {
              console.log('Biometrics device is enrolled');
              const jsInjectApexEvent = `
              apex.event.trigger(window, 'vis-biometrics-enrolled');
              `;
              webref.current.injectJavaScript(jsInjectApexEvent);
            }
            else {
              console.log('Biometrics device is not enrolled');
              const jsInjectApexEvent = `
              apex.event.trigger(window, 'vis-biometrics-not-enrolled');
              `;
              webref.current.injectJavaScript(jsInjectApexEvent);
            }
          })
          .catch((e) => console.log(e));
          break;
        }
        case 'vis-biometrics-cancel-enrollment': {
          resetDeviceBiometrics()
            .then((isReset) => {
              if (!webref || !webref.current || !isReset) return;

              console.log('Biometrics enrollment cancelled');
              setPubKey('');
              const jsInjectApexEvent = `
              apex.event.trigger(window, 'vis-biometrics-enrollment-cancel');
              `;
              webref.current.injectJavaScript(jsInjectApexEvent);
            })
            .catch((e) => console.log(e));
          break;
        }
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <WebView ref={webref} onMessage={webviewOnMessage} style={{ flex: 1 }} pullToRefreshEnabled={true}
        source={{ uri: 'https://apexdev.viscosity.ai/r/kherrarte/biometric-authentication/' }} />
    </SafeAreaView>
  );
}