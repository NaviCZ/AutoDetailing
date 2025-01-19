import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, get, push, set, remove, onValue } from 'firebase/database';

// ====== Vytvoření kontextu ======
const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
  // ====== Základní stavy ======
  const [serviceGroups, setServiceGroups] = useState({});
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ====== Stav nastavení aplikace ======
  const [settings, setSettings] = useState({
    carSizeMarkup: 0.3,
    priceListYear: new Date().getFullYear()
  });

  // ====== Načtení dat z Firebase ======
  useEffect(() => {
    const database = getDatabase();
    
    // Načtení služeb
    const servicesRef = ref(database, 'services');
    // Načtení nastavení
    const settingsRef = ref(database, 'settings');
    
    // Listener pro služby
    const servicesUnsubscribe = onValue(servicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const servicesData = snapshot.val();
        const transformedServices = {};
        const packagesData = {};
        
        // Zpracování dat
        Object.entries(servicesData).forEach(([category, categoryData]) => {
          if (category === 'package') {
            // Zpracování balíčků
            if (categoryData.items) {
              Object.values(categoryData.items).forEach(packageItem => {
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
            transformedServices[category] = {
              items: Object.values(categoryData.items || {})
            };
          }
        });
        
        setServiceGroups(transformedServices);
        setPackages(packagesData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Chyba při načítání dat:', error);
      setError('Chyba při načítání dat: ' + error.message);
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
      settingsUnsubscribe();
    };
  }, []);

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
      const serviceData = {
        id: updatedService.id,
        name: updatedService.name,
        price: Number(updatedService.price),
        mainCategory: serviceGroupId,
        subcategory: updatedService.subcategory || '',
        hourly: Boolean(updatedService.hourly),
        hasVariants: false,
        variants: [],
        isPackage: false
      };
      
      await set(serviceRef, serviceData);
      return true;
    } catch (err) {
      console.error('Chyba při úpravě služby:', err);
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

  // ====== Poskytnutí kontextu ======
  return (
    <ServiceContext.Provider
      value={{
        serviceGroups,
        packages,
        loading,
        error,
        settings,
        addService,
        updateService,
        deleteService,
        addPackage,
        updatePackage,
        deletePackage,
        updateSettings
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

// ====== Hook pro použití kontextu ======
export const useServiceContext = () => {
  return useContext(ServiceContext);
};