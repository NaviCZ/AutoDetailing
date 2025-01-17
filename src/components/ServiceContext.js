import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, get, push, set, remove, onValue } from 'firebase/database';

const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
  const [serviceGroups, setServiceGroups] = useState({});
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const database = getDatabase();
    const servicesRef = ref(database, 'services');
  
    // Vytvoříme listener pro real-time aktualizace
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const servicesData = snapshot.val();
        const transformedServices = {};
        const packagesData = {};
        
        // Procházení všech kategorií
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
  
    // Cleanup listener při unmount
    return () => unsubscribe();
  }, []); // Prázdné dependency array - spustí se pouze jednou při mount

  // Přidání nového balíčku
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

  // Úprava existujícího balíčku
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

  // Smazání balíčku
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

  // Původní metody pro práci se službami zůstávají stejné...
  const addService = async (serviceGroupId, newService) => {
    const database = getDatabase();
    try {
      const category = serviceGroupId || (newService.isPackage ? 'package' : 'undefined');
      const serviceRef = ref(database, `services/${category}/items/${newService.id}`);
      await set(serviceRef, newService);
  
      // Let the Firebase listener handle the state update
      // Remove the manual state updates to prevent duplicates
    } catch (err) {
      console.error('Chyba při přidávání služby:', err);
      setError('Chyba při přidávání služby: ' + err.message);
    }
  };

  const updateService = async (serviceGroupId, updatedService) => {
    const database = getDatabase();
    const serviceRef = ref(database, `services/${serviceGroupId}/items/${updatedService.id}`);
    
    try {
      await set(serviceRef, updatedService);
      setServiceGroups(prev => ({
        ...prev,
        [serviceGroupId]: {
          ...prev[serviceGroupId],
          items: prev[serviceGroupId]?.items.map(service => 
            service.id === updatedService.id ? updatedService : service
          )
        },
      }));
    } catch (err) {
      console.error('Chyba při úpravě služby:', err);
      setError('Chyba při úpravě služby: ' + err.message);
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

  return (
  <ServiceContext.Provider
    value={{
      serviceGroups,
      packages,
      loading,
      error,
      addService,
      updateService,
      deleteService,
      addPackage,
      updatePackage, // Přidáno
      deletePackage,
    }}
  >
    {children}
  </ServiceContext.Provider>
);
};



export const useServiceContext = () => {
  return useContext(ServiceContext);
};