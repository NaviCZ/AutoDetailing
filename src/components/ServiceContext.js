// ServiceContext.js
// Kontext pro správu služeb, balíčků a jejich pořadí v aplikaci
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, get, push, set, remove, onValue } from 'firebase/database';

// Vytvoření kontextu
const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
 // ====== Základní stavy ======
 const [serviceGroups, setServiceGroups] = useState({});
 const [packages, setPackages] = useState({});
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [subcategoryOrder, setSubcategoryOrder] = useState({ categories: {}, services: {} });
 
 // ====== Stav nastavení aplikace ======
 const [settings, setSettings] = useState({
   carSizeMarkup: 0.3,
   priceListYear: new Date().getFullYear()
 });

 // ====== Načítání dat z Firebase ======
 useEffect(() => {
   const database = getDatabase();
   const servicesRef = ref(database, 'services');
   const settingsRef = ref(database, 'settings');
   const orderRef = ref(database, 'settings/subcategoryOrder');

   // Funkce pro seřazení služeb podle pořadí
   const sortServicesByOrder = (items, category, orderData) => {
    // Nejprve seskupíme položky podle podkategorií
    const groupedItems = items.reduce((acc, item) => {
      const subcategory = item.subcategory || 'default';
      if (!acc[subcategory]) {
        acc[subcategory] = [];
      }
      acc[subcategory].push(item);
      return acc;
    }, {});
  
    // Seřadíme každou podkategorii podle pořadí služeb
    Object.keys(groupedItems).forEach(subcategory => {
      groupedItems[subcategory].sort((a, b) => {
        const orderA = orderData.services?.[category]?.[subcategory]?.[a.id] ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderData.services?.[category]?.[subcategory]?.[b.id] ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    });
  
    // Seřadíme podkategorie podle jejich pořadí a spojíme položky
    const subcategoryOrder = orderData.categories?.[category] || {};
    return Object.entries(groupedItems)
      .sort(([subcatA], [subcatB]) => {
        const orderA = subcategoryOrder[subcatA] ?? Number.MAX_SAFE_INTEGER;
        const orderB = subcategoryOrder[subcatB] ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      })
      .flatMap(([_, items]) => items);
  };

   // Listener pro změny v pořadí
   const orderUnsubscribe = onValue(orderRef, (snapshot) => {
  const orderData = snapshot.exists() ? snapshot.val() : { categories: {}, services: {} };
  setSubcategoryOrder(orderData);
  
  // Okamžitá aktualizace seřazení všech dat
  setServiceGroups(prevGroups => {
    const newGroups = {};
    Object.entries(prevGroups).forEach(([category, data]) => {
      if (data?.items) {
        newGroups[category] = {
          ...data,
          items: sortServicesByOrder([...data.items], category, orderData)
        };
      }
    });
    return newGroups;
  });

  // Seřazení balíčků
  setPackages(prevPackages => {
    const packageEntries = Object.entries(prevPackages);
    packageEntries.sort(([nameA], [nameB]) => {
      const orderA = orderData.categories?.package?.[nameA] ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderData.categories?.package?.[nameB] ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    return Object.fromEntries(packageEntries);
  });
});

   // Listener pro služby
   const servicesUnsubscribe = onValue(servicesRef, (snapshot) => {
     if (snapshot.exists()) {
       const servicesData = snapshot.val();
       const transformedServices = {};
       const packagesData = {};

       Object.entries(servicesData).forEach(([category, categoryData]) => {
         if (category === 'package') {
           // Zpracování balíčků
           if (categoryData.items) {
             const sortedPackages = Object.values(categoryData.items)
               .sort((a, b) => {
                 const orderA = subcategoryOrder.categories?.package?.[a.name] ?? 999;
                 const orderB = subcategoryOrder.categories?.package?.[b.name] ?? 999;
                 return orderA - orderB;
               });

             sortedPackages.forEach(packageItem => {
               packagesData[packageItem.name] = {
                 id: packageItem.id,
                 price: packageItem.price || 0,
                 services: packageItem.services || [],
                 description: packageItem.description || ''
               };
             });
           }
         } else {
           // Zpracování běžných služeb
           const items = categoryData.items ? Object.values(categoryData.items) : [];
           transformedServices[category] = {
             items: sortServicesByOrder(items, category, subcategoryOrder)
           };
         }
       });

       setServiceGroups(transformedServices);
       setPackages(packagesData);
     }
     setLoading(false);
   });

   // Listener pro nastavení
   const settingsUnsubscribe = onValue(settingsRef, (snapshot) => {
     if (snapshot.exists()) {
       setSettings(snapshot.val());
     }
   });

   // Cleanup při unmount
   return () => {
     servicesUnsubscribe();
     orderUnsubscribe();
     settingsUnsubscribe();
   };
 }, []); // Prázdné závislosti - efekt se spustí jen při mount

 // ====== Funkce pro správu balíčků ======
 const addPackage = async (packageData) => {
   const database = getDatabase();
   const packageRef = ref(database, `services/package/items/${packageData.id}`);
   
   try {
     await set(packageRef, packageData);
     setPackages(prev => ({
       ...prev,
       [packageData.name]: {
         id: packageData.id,
         price: packageData.price,
         services: packageData.services || [],
         description: packageData.description || ''
       }
     }));
   } catch (err) {
     console.error('Chyba při přidávání balíčku:', err);
     setError('Chyba při přidávání balíčku: ' + err.message);
   }
 };

 const updatePackage = async (packageId, updatedPackage) => {
   const database = getDatabase();
   const packageRef = ref(database, `services/package/items/${packageId}`);
   
   try {
     await set(packageRef, updatedPackage);
     setPackages(prev => ({
       ...prev,
       [updatedPackage.name]: {
         id: updatedPackage.id,
         price: updatedPackage.price,
         services: updatedPackage.services || [],
         description: updatedPackage.description || ''
       }
     }));
   } catch (err) {
     console.error('Chyba při úpravě balíčku:', err);
     setError('Chyba při úpravě balíčku: ' + err.message);
   }
 };

 const deletePackage = async (packageId) => {
   const database = getDatabase();
   const packageRef = ref(database, `services/package/items/${packageId}`);
   
   try {
     await remove(packageRef);
     setPackages(prev => {
       const newPackages = { ...prev };
       const packageToDelete = Object.entries(newPackages)
         .find(([_, pkg]) => pkg.id === packageId);
       if (packageToDelete) {
         delete newPackages[packageToDelete[0]];
       }
       return newPackages;
     });
   } catch (err) {
     console.error('Chyba při mazání balíčku:', err);
     setError('Chyba při mazání balíčku: ' + err.message);
   }
 };

 // ====== Funkce pro správu služeb ======
 const addService = async (serviceGroupId, newService) => {
   const database = getDatabase();
   try {
     const category = serviceGroupId || (newService.isPackage ? 'package' : 'undefined');
     const serviceRef = ref(database, `services/${category}/items/${newService.id}`);
     await set(serviceRef, newService);
   } catch (err) {
     console.error('Chyba při přidávání služby:', err);
     setError('Chyba při přidávání služby: ' + err.message);
   }
 };

const updateService = async (serviceGroupId, updatedService) => {
    const database = getDatabase();
    const serviceRef = ref(database, `services/${serviceGroupId}/items/${updatedService.id}`);
    
    try {
        // Nejdřív dostaneme původní data
        const snapshot = await get(serviceRef);
        const originalData = snapshot.exists() ? snapshot.val() : {};
        
        // Zachováme všechny vlastnosti a přidáme/aktualizujeme nové
        const serviceToSave = {
            ...originalData,
            ...updatedService,
            hasVariants: updatedService.hasVariants,
            variants: updatedService.variants || []
        };
        
        console.log('ServiceContext - Data k uložení:', serviceToSave);
        await set(serviceRef, serviceToSave);
        return true;
    } catch (err) {
        console.error('Chyba při ukládání:', err);
        throw err;
    }
};


 const deleteService = async (serviceGroupId, serviceId) => {
   const database = getDatabase();
   const serviceRef = ref(database, `services/${serviceGroupId}/items/${serviceId}`);
   
   try {
     await remove(serviceRef);
     setServiceGroups(prev => ({
       ...prev,
       [serviceGroupId]: {
         ...prev[serviceGroupId],
         items: prev[serviceGroupId]?.items.filter(service => service.id !== serviceId)
       },
     }));
   } catch (err) {
     console.error('Chyba při mazání služby:', err);
     setError('Chyba při mazání služby: ' + err.message);
   }
 };

 // ====== Funkce pro správu nastavení ======
 const updateSettings = async (newSettings) => {
   const database = getDatabase();
   const settingsRef = ref(database, 'settings');
   try {
     await set(settingsRef, newSettings);
     setSettings(newSettings);
     return true;
   } catch (err) {
     console.error('Chyba při ukládání nastavení:', err);
     throw err;
   }
 };

 // ====== Funkce pro správu pořadí podkategorií ======
 const updateSubcategoryOrder = async (orderData) => {
   const database = getDatabase();
   const orderRef = ref(database, 'settings/subcategoryOrder');
   try {
     await set(orderRef, orderData);
     return true;
   } catch (err) {
     console.error('Chyba při ukládání pořadí:', err);
     throw err;
   }
 };

 // ====== Poskytnutí kontextu ======
 return (
  <ServiceContext.Provider
    value={{
      serviceGroups,
      packages,
      loading,
      error,
      settings,
      subcategoryOrder,
      addService,
      updateService,
      deleteService,
      addPackage,
      updatePackage,
      deletePackage,
      updateSettings,
      updateSubcategoryOrder
    }}
  >
    {children}
  </ServiceContext.Provider>
);
};

// Hook pro použití kontextu
export const useServiceContext = () => {
return useContext(ServiceContext);
};

export default ServiceContext;