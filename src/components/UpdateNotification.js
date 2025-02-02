// UpdateNotification.js
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update, query, orderByChild, limitToLast, get, remove } from 'firebase/database';
import { X } from 'lucide-react';

const NOTIFICATION_EXPIRY_DAYS = 30; // Nastavení doby expirace na 30 dní

const UpdateNotification = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    if (!user?.uid) return;

    const db = getDatabase();
    const notificationsRef = query(
      ref(db, 'updates/history'),
      orderByChild('timestamp'),
      limitToLast(10)
    );

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notifs = [];
      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val();
        const id = childSnapshot.key;
        // Zobrazíme pouze notifikace, které:
        // 1. Nejsou označené jako přečtené pro tohoto uživatele
        // 2. Nebyly vytvořeny tímto uživatelem
        if (
          (!notification.seenBy || !notification.seenBy[user.uid]) && 
          notification.createdBy !== user.uid
        ) {
          notifs.push({ ...notification, id });
        }
      });
      setNotifications(notifs.reverse());
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismiss = async (notificationId) => {
    try {
      const db = getDatabase();
      await update(ref(db), {
        [`updates/history/${notificationId}/seenBy/${user.uid}`]: true
      });
    } catch (error) {
      console.error('Chyba při označování notifikace jako přečtené:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 mb-2"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-blue-900">{notification.message}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleDateString('cs-CZ', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {notification.daysOld > 0 && ` (před ${notification.daysOld} dny)`}
              </p>
            </div>
            <button 
              onClick={() => handleDismiss(notification.id)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpdateNotification;