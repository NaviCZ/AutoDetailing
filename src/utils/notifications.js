// utils/notifications.js
import { getDatabase, ref, set, push, query, orderByChild, limitToLast } from 'firebase/database';

// Pomocná funkce pro porovnání změn
const compareChanges = (oldData, newData, fields) => {
  const changes = {};
  
  fields.forEach(({ field, label, format }) => {
    if (oldData[field] !== newData[field]) {
      changes[label] = {
        z: format ? format(oldData[field]) : oldData[field],
        na: format ? format(newData[field]) : newData[field]
      };
    }
  });

  return Object.keys(changes).length > 0 ? changes : null;
};

// Funkce pro sledování změn služby
export const trackServiceChanges = (oldService, newService, user) => {
  const changes = {};
  
  if (oldService.name !== newService.name) {
    changes.název = {
      z: oldService.name,
      na: newService.name
    };
  }
  
  if (oldService.price !== newService.price) {
    changes.cena = {
      z: `${oldService.price} Kč`,
      na: `${newService.price} Kč`
    };
  }
  
  if (oldService.subcategory !== newService.subcategory) {
    changes.podkategorie = {
      z: oldService.subcategory || '(žádná)',
      na: newService.subcategory || '(žádná)'
    };
  }

  if (Object.keys(changes).length > 0) {
    const changesList = Object.entries(changes)
      .map(([key, { z, na }]) => `${key} (z "${z}" na "${na}")`)
      .join(', ');

    return {
      message: `Upravena služba ${newService.name}`,
      changes: {
        message: changesList,
        details: changes
      }
    };
  }
  return null;
};

// Funkce pro sledování změn balíčku
export const trackPackageChanges = (oldPackage, newPackage, user) => {
  const changes = {};

  if (oldPackage.name !== newPackage.name) {
    changes.název = {
      z: oldPackage.name,
      na: newPackage.name
    };
  }

  if (oldPackage.price !== newPackage.price) {
    changes.cena = {
      z: `${oldPackage.price} Kč`,
      na: `${newPackage.price} Kč`
    };
  }

  const oldServices = oldPackage.services || [];
  const newServices = newPackage.services || [];
  if (oldServices.length !== newServices.length || 
      !oldServices.every(service => newServices.includes(service))) {
    changes.obsah = {
      z: `${oldServices.length} služeb`,
      na: `${newServices.length} služeb`
    };
  }

  if (Object.keys(changes).length > 0) {
    const changesList = Object.entries(changes)
      .map(([key, { z, na }]) => `${key} (z "${z}" na "${na}")`)
      .join(', ');

    return {
      message: `Upraven balíček ${newPackage.name}`,
      changes: {
        message: changesList,
        details: changes
      }
    };
  }
  return null;
};

// Hlavní funkce pro vytvoření notifikace
export const createUpdateNotification = async (message, details = null, user = null) => {
  const db = getDatabase();
  const notificationsRef = ref(db, 'updates/history');
  
  await push(notificationsRef, {
    timestamp: Date.now(),
    message: details?.message ? `${message}: ${details.message}` : message,
    details,
    createdBy: user?.uid || null,
    userEmail: user?.email || null
  });
};

 // Funkce pro vytvoření notifikace o smazání balíčku
 export const createPackageDeleteNotification = async (packageData, user) => {
  const message = `Smazán balíček ${packageData.name}`;
  const details = {
    název: {
      z: packageData.name,
      na: '(smazáno)'
    },
    'počet služeb': {
      z: packageData.services?.length || 0,
      na: 0
    },
    cena: {
      z: `${packageData.price} Kč`,
      na: '0 Kč'
    }
  };

  const changesList = Object.entries(details)
    .map(([key, { z }]) => `${key} ("${z}")`)
    .join(', ');

  try {
    await createUpdateNotification(message, {
      message: changesList,
      details
    }, user);
  } catch (error) {
    console.error('Chyba při vytváření notifikace:', error);
    throw error;
  }
};