import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationContact, NotificationEvent, PushSubscription, NotificationPayload } from '@/types';
import { generateNotificationContentForEvent } from '@/services/notificationTemplatingService';
import { sendEmail } from '@/services/emailService';
import webpush from 'web-push';

let isVapidInitialized = false;

// Lazily initialize web-push to avoid running this code during build time.
// This function is called only when a push notification needs to be sent.
function initializeWebPush() {
  if (isVapidInitialized) {
    return true; // Already initialized
  }

  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        process.env.VAPID_MAILTO || 'mailto:your-email@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      isVapidInitialized = true;
      console.log('VAPID details configured successfully.');
      return true;
    } catch (error) {
      console.error('Failed to set VAPID details:', error);
      return false;
    }
  } else {
    console.warn('VAPID keys not configured. Push notifications will be disabled.');
    return false;
  }
}

// Helper to get all notification contacts
async function getAllNotificationContacts(): Promise<NotificationContact[]> {
  const contactsSnapshot = await getDocs(collection(db, 'notification_contacts'));
  return contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationContact));
}

// Helper to get all push subscriptions
async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const subscriptionsSnapshot = await getDocs(collection(db, 'pushSubscriptions'));
  return subscriptionsSnapshot.docs.map(doc => doc.data() as PushSubscription);
}

// Main dispatcher function
export async function dispatchNotification(event: NotificationEvent, payload: NotificationPayload) {
  console.log(`Dispatching notification for event: ${event}`);

  const [allContacts, allPushSubscriptions] = await Promise.all([
    getAllNotificationContacts(),
    getAllPushSubscriptions(),
  ]);

  if (allContacts.length === 0) {
    console.log('No notification contacts found. Aborting.');
    return;
  }

  const { subject, body } = generateNotificationContentForEvent(event, payload);
  const referenceUrl = payload.order?.id ? `/orders/${payload.order.id}` : '/';

  for (const contact of allContacts) {
    const contactSettings = contact.settings?.[event];
    if (!contactSettings) continue;

    console.log(`Processing notifications for ${contact.name} for event ${event}`);

    // 1. Send Email
    if (contactSettings.email) {
      try {
        await sendEmail({ to: contact.email, subject, body });
        console.log(`Email sent to ${contact.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${contact.email}:`, error);
      }
    }

    // 2. Queue In-App Notification
    if (contactSettings.inApp) {
      try {
        await addDoc(collection(db, 'notifications'), {
          // We can associate with a user if needed, for now it's general
          // userId: contact.id, // Or a generic system ID
          createdAt: Timestamp.now(),
          type: event,
          channel: 'inApp',
          title: subject,
          body: body,
          isRead: false,
          referenceUrl,
        });
        console.log(`In-app notification queued for ${contact.name}`);
      } catch (error) {
        console.error(`Failed to queue in-app notification for ${contact.name}:`, error);
      }
    }

    // 3. Send Push Notification
    if (contactSettings.push && allPushSubscriptions.length > 0) {
      const canSendPush = initializeWebPush();
      if (!canSendPush) {
        console.warn('Skipping push notification due to VAPID initialization failure.');
        continue;
      }
      
      console.log(`Sending push notifications to ${allPushSubscriptions.length} subscribers.`);
      const pushPayload = JSON.stringify({ title: subject, body, url: referenceUrl });
      
      for (const sub of allPushSubscriptions) {
        try {
          await webpush.sendNotification(sub, pushPayload);
        } catch (error) {
          console.error(`Error sending push to ${sub.endpoint}:`, error);
          // Here you might want to add logic to remove expired subscriptions
        }
      }
    } else if (contactSettings.push) {
        console.log(`Push notifications for ${contact.name} skipped (no subscribers).`);
    }
  }
}
