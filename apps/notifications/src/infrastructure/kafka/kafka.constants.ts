export const KAFKA_TOPICS = {
  EMAIL: {
    CREATE: 'NOTIFICATIONS.email.service.create',
  },
  SMS: {
    CREATE: 'NOTIFICATIONS.sms.service.create',
  },
  BELL_NOTIFICATION: {
    CREATE: 'NOTIFICATIONS.bellNotification.service.create',
  },
};

export const KAFKA_EVENTS = {
  EMAIL: {
    CREATED: 'NOTIFICATIONS.email.event.created',
    SENT: 'NOTIFICATIONS.email.event.sent',
    FAILED: 'NOTIFICATIONS.email.event.failed',
  },
  SMS: {
    CREATED: 'NOTIFICATIONS.sms.event.created',
    SENT: 'NOTIFICATIONS.sms.event.sent',
    FAILED: 'NOTIFICATIONS.sms.event.failed',
  },
  BELL_NOTIFICATION: {
    CREATED: 'NOTIFICATIONS.bellNotification.event.created',
    SENT: 'NOTIFICATIONS.bellNotification.event.sent',
    FAILED: 'NOTIFICATIONS.bellNotification.event.failed',
  },
};

export const KAFKA_HUB = {
  EMAIL: {
    MATRACA_GATEWAY: 'NOTIFICATIONS.email.observer.matraca',
    DEAD_LETTER: 'NOTIFICATIONS.email.observer.deadLetter',
  },
  SMS: {
    ZENVIA_GATEWAY: 'NOTIFICATIONS.sms.observer.zenvia',
    DOCK_GATEWAY: 'NOTIFICATIONS.sms.observer.dock',
    BULKSMS_GATEWAY: 'NOTIFICATIONS.sms.observer.bulksms',
    DEAD_LETTER: 'NOTIFICATIONS.sms.observer.deadLetter',
  },
  BELL_NOTIFICATION: {
    FCM_GATEWAY: 'NOTIFICATIONS.bellNotification.observer.fcm',
  },
};
