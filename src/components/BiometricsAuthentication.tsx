import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics'
import en from '../i18n/locales/en';

export type BiometricsSignature = {
  signature: string | undefined,
  success: boolean,
}

export type BiometricsEnrollment = {
  publicKey: string | undefined,
  signature: string | undefined,
  success: boolean,
}

export const rnBiometrics = new ReactNativeBiometrics();

export async function storeUserName(username: string) {
  try {
    await AsyncStorage.setItem('@userName', username);
  } catch (e) {
    // saving error
  }
}

export async function removeUserName() {
  try {
    await AsyncStorage.removeItem('@userName')
  } catch(e) {
    // remove error
  }
}

export async function storePublicKey(publicKey: string) {
  try {
    await AsyncStorage.setItem('@publicKey', publicKey);
  } catch (e) {
    // saving error
  }
}

export async function removePublicKey() {
  try {
    await AsyncStorage.removeItem('@publicKey')
  } catch(e) {
    // remove error
  }
}

/**
 * Enroll Device to Biometrics Authentication Flow
 * @param promptMessage Message that will be displayed on Android Biometrics Prompt
 * @param payload Message that will be signed
 * @param cancelText Cancel button text to be displayed on Android Prompt
 * @returns Generated Public Key and Signature for validation
 */
export async function getEnrollment(promptMessage: string, payload: string, cancelText: string, force?: boolean) {
  const { keysExist } = await rnBiometrics.biometricKeysExist();

  if (keysExist && force === true) {
    await resetDeviceBiometrics();
  }
  else if (keysExist && force !== true) {
    throw new Error(en.errors.biometrics_device_enrolled);
  }

  const { publicKey } = await rnBiometrics.createKeys();
  
  if (!publicKey) {
    throw new Error(en.errors.biometrics_keys_generation);
  }

  const { signature, success } = await getSignature(promptMessage, payload, cancelText);
  const enrollment: BiometricsEnrollment = { publicKey, signature, success };

  if (!signature) {
    throw new Error(en.errors.biometrics_signature_creation);
  }

  await storePublicKey(publicKey);

  return enrollment;
}

/**
 * Get device signature for Biometrics Authentication
 * @param promptMessage (optiona) Device biometrics prompt message
 * @param payload (optiona) Message to be signed
 * @param cancelText (optiona) Devices biometrics prompt cancel button
 * @returns Signature
 */
export async function getSignature(promptMessage?: string, payload?: string, cancelText?: string) {
  const userName = await AsyncStorage.getItem('@userName');
  const { signature, success } = await rnBiometrics.createSignature({
    promptMessage: promptMessage || 'User your fingerprint to continue',
    cancelButtonText: cancelText || 'Cancel',
    payload: payload || userName || '',
  });
  const mySignature: BiometricsSignature = { signature, success };

  return mySignature;
}

/**
 * Check if Device is enrolled and Biometrics is supported
 * @returns True/False based on enrollment status
 */
export async function isDeviceEnrolled() {
  if (!await isBiometricSupported()) {
    console.log(en.errors.biometrics_not_supported);
    return false;
  }

  const { keysExist } = await rnBiometrics.biometricKeysExist();
  if (!keysExist) {
    console.log(en.errors.biometrics_no_keys);
    return false;
  }

  return true;
}

/**
 * Check if Device has FaceID / TouchID or Android Biometrics supported sensor
 * @returns True/False based on device support
 */
export async function isBiometricSupported() {
  let { available } = await rnBiometrics.isSensorAvailable();
  
  return available;
}

/**
 * Get Device Biometric Type information
 * @returns Biometric type and display name
 */
export async function getBiometricType() {
  let { available, biometryType } = await rnBiometrics.isSensorAvailable();

  if (available && biometryType == BiometryTypes.FaceID) {
    return { name: biometryType, displayName: 'Face ID' };
  }
  else if (available && biometryType == BiometryTypes.TouchID) {
    return { name: biometryType, displayName: 'Touch ID' };
  }
  else if (available) {
    return { name: biometryType, displayName: biometryType };
  }
  
  return null;
}

/**
 * Resets Biometrics Enrollment from device
 */
export async function resetDeviceBiometrics() {
  const { keysDeleted } = await rnBiometrics.deleteKeys();

  if (keysDeleted) {
    await removeUserName();
    await removePublicKey();
    console.log('Device Biometrics reset successfully');
    return keysDeleted;
  }
  
  console.log('Unsuccessful biometrics reset');
  return keysDeleted;
}