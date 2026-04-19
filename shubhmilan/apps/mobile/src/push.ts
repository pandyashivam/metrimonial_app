import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

/** Ask the user for push permission (idempotent) and register the Expo token with the server. */
export async function registerForPushAsync(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return false;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await api.me.registerDevice({
      fcmToken: token,
      platform: (Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web') as
        | 'ios'
        | 'android'
        | 'web',
    });
    return true;
  } catch {
    return false;
  }
}
