// notificationService.js

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidStyle,
  EventType,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import {
  getUpcomingMedicines,
  getUserDetail,
  updateMedicineStatus,
} from './DatabaseService';

/**
 * Schedules a notification for a specific medicine reminder
 * @param {number} medicineId - The unique ID of the medicine.
 * @param {string} medicineName - The name of the medicine.
 * @param {Date} notificationTime - The time when the notification should be triggered.
 * @param {string} time - The scheduled time for the notification.
 *
 */

const scheduleNotification = async (
  medicineId,
  scheduleId,
  medicineName,
  notificationTime,
  t,
) => {
  try {
    const sound = Platform.Version >= 33 ? 'wakeup' : 'default';
    if (
      !(notificationTime instanceof Date) ||
      isNaN(notificationTime.getTime())
    ) {
      throw new Error('Invalid notification time.');
    }

    const user = await getUserDetail();
    const channelId = await createNotificationChannel();

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: notificationTime.valueOf(),
      alarmManager: Platform.OS === 'android' ? {allowWhileIdle: true} : undefined,
    };

    const message = t('notificationMessage', {
      time: notificationTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      date: notificationTime.toISOString().split('T')[0],
      medicine: medicineName,
    });

    await notifee.createTriggerNotification(
      {
        id: `medicine_${medicineId}_schedule_${scheduleId}`,
        title: `Hello ${user.name}, Medication Reminder!`,
        body: `It's time to take your medicine: ${medicineName}`,
        android: {
          channelId,
          sound,
          largeIcon: require('../Assets/logo.jpg'),
          style: {type: AndroidStyle.BIGTEXT, text: message},
          pressAction: {id: 'default', launchActivity: 'default'},
          category: AndroidCategory.ALARM,
          lightUpScreen: true,
          loopSound: true,
          showTimestamp: true,
          actions: [
            {
              title: 'Take',
              pressAction: {id: 'take', launchActivity: 'default'},
            },
            {
              title: 'Skip',
              pressAction: {id: 'skip', launchActivity: 'default'},
            },
          ],
        },
        ios: {
          categoryId: 'medication',
          sound: 'default',
          attachments: [{url: 'logo', thumbnailHidden: true}],
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
          critical: true,
          criticalVolume: 1.0,
          threadId: 'medication-reminders',
          actions: [
            {
              id: 'take',
              title: 'Take',
              options: {
                foreground: true,
              },
            },
            {
              id: 'skip',
              title: 'Skip',
              options: {
                foreground: true,
              },
            },
          ],
        },
      },
      trigger,
    );

    console.log(
      `Notification scheduled for ${medicineName} at ${notificationTime}`,
    );
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

const createNotificationChannel = async () => {
  // Skip channel creation on iOS as it's not needed
  if (Platform.OS === 'ios') {
    return 'default';
  }

  const channelId = 'alarm';
  const channels = await notifee.getChannels();
  const channelExists = channels.some(channel => channel.id === channelId);

  if (!channelExists) {
    return await notifee.createChannel({
      id: channelId,
      name: 'Medication Alarms',
      lights: true,
      vibration: true,
      vibrationPattern: [300, 500],
      importance: AndroidImportance.HIGH,
      sound: Platform.Version >= 33 ? 'wakeup' : 'default',
    });
  }

  return channelId;
};

const refreshNotifications = async t => {
  try {
    // Request permissions for iOS
    if (Platform.OS === 'ios') {
      await notifee.requestPermission({
        alert: true,
        badge: true,
        sound: true,
        critical: true,
      });
    }

    // Step 1: Cancel all scheduled notifications
    await notifee.cancelAllNotifications();
    console.log('All notifications cleared.');

    // Step 2: Fetch upcoming medicines
    const medicines = await getUpcomingMedicines(); // Fetch medicines from DB
    if (!medicines || medicines.length === 0) return;

    // Step 3: Sort and get only the next 50
    const upcomingMedicines = medicines
      .sort((a, b) => new Date(a.schedule) - new Date(b.schedule))
      .slice(0, 50);

    // Step 4: Schedule notifications for the next 50 medicines
    for (const med of upcomingMedicines) {
      await scheduleNotification(
        med.id,
        med.scheduleId,
        med.name,
        new Date(med.schedule),
        t,
      );
    }
    console.log('Scheduled next 50 medicine reminders.');
  } catch (error) {
    console.error('Error refreshing notifications:', error);
  }
};

const cleanupOldNotifications = async t => {
  try {
    const notifications = await notifee.getTriggerNotifications();

    if (notifications.length < 20) {
      console.log(`Deleted ${notifications.length} old notifications.`);

      // After deleting, schedule next 50
      await refreshNotifications(t);
    }
  } catch (error) {
    console.error('Error cleaning old notifications:', error);
  }
};

/**
 * Handles user actions on notifications (Take / Skip)
 */
const handleNotificationPress = () => {
  notifee.onForegroundEvent(async ({type, detail}) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction.id) {
      const [medicineId, scheduleId] = getMedicineAndScheduleId(
        detail.notification.id,
      );

      if (medicineId && scheduleId) {
        if (detail.pressAction.id === 'take') {
          await updateMedicineStatus(scheduleId, 'taken');
        } else {
          await updateMedicineStatus(scheduleId, 'missed');
        }
      }
    }
  });

  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction.id) {
      const [medicineId, scheduleId] = getMedicineAndScheduleId(
        detail.notification.id,
      );

      if (medicineId && scheduleId) {
        if (detail.pressAction.id === 'take') {
          await updateMedicineStatus(scheduleId, 'taken');
        } else {
          await updateMedicineStatus(scheduleId, 'missed');
        }
      }
    }
  });
};

/**
 * Extracts medicine and schedule ID from notification identifier
 */
export const getMedicineAndScheduleId = identifier => {
  const parts = identifier.split('_');
  return [parts[1], parts[3]];
};

export {
  cleanupOldNotifications, handleNotificationPress, refreshNotifications, scheduleNotification
};
