import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device'; // ose 'expo-device'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Leja për njoftime u refuzua');
    return;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  // KEMI HEQUR GETEXPOPUSHTOKENASYNC SEPSE SHKAKTON ERROR NE EXPO GO SDK 53
}

export async function scheduleMedicationReminder(medicineName, date) {
  const trigger = {
    hour: date.getHours(),
    minute: date.getMinutes(),
    repeats: true,
  };

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Koha për mjekim!",
      body: `Mos harroni dozën e: ${medicineName}`,
    },
    trigger,
  });
}