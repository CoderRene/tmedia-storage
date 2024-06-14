import { PermissionsAndroid, Platform } from "react-native";

export function usePermissions() {

  const requestPermissions = async (proceed: () => void) => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          // PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,r
        ]);
        if (
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          proceed();
        } else {
          proceed();
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  return { requestPermissions }
}