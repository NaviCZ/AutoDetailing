
// CategoryOrder.js - Komponenta pro správu pořadí kategorií, podkategorií a služeb
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { useServiceContext } from '../ServiceContext';
import { Button } from '../ui/Button';

const CategoryOrder = () => {
  // ====== Načtení kontextu a inicializace stavů ======
  const { serviceGroups, packages, updateSubcategoryOrder } = useServiceContext();

   // State pro rozbalené kategorie
   const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // State pro podkategorie a jejich služby
  const [subcategories, setSubcategories] = useState({
    interior: [],
    exterior: [],
    package: []
  });

  // State pro UI stavy
  const [isLoading, setIsLoading] = useState(false);
  const [movedItem, setMovedItem] = useState(null);
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());

  // Funkce pro přepínání kategorie
  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // ====== Načtení dat při inicializaci ======
  useEffect(() => {
    if (serviceGroups && packages) {
      const uniqueSubcategories = {
        interior: [],
        exterior: [],
        package: []
      };

      const loadOrder = async () => {
        const database = getDatabase();
        const orderRef = ref(database, 'settings/subcategoryOrder');
        const snapshot = await get(orderRef);
        const existingOrder = snapshot.exists() ? snapshot.val() : {};

        // Zpracování běžných kategorií (interiér, exteriér)
        Object.entries(serviceGroups).forEach(([category, data]) => {
          if (data?.items) {
            const subcatsSet = new Set();
            data.items.forEach(item => {
              if (item.subcategory) {
                subcatsSet.add(item.subcategory);
              }
            });

            const categoryOrder = existingOrder.categories?.[category] || {};
            const subcats = Array.from(subcatsSet)
              .map(name => ({
                id: name,
                name: name,
                order: categoryOrder[name] ?? Number.MAX_SAFE_INTEGER,
                items: data.items.filter(item => item.subcategory === name)
                  .sort((a, b) => {
                    const orderA = existingOrder.services?.[category]?.[name]?.[a.id] ?? Number.MAX_SAFE_INTEGER;
                    const orderB = existingOrder.services?.[category]?.[name]?.[b.id] ?? Number.MAX_SAFE_INTEGER;
                    return orderA - orderB;
                  })
              }))
              .sort((a, b) => a.order - b.order);

            uniqueSubcategories[category] = subcats;
          }
        });

        // Zpracování balíčků
        if (packages) {
          uniqueSubcategories.package = Object.entries(packages)
            .map(([name, data]) => ({
              id: data.id,
              name: name,
              order: existingOrder.categories?.package?.[name] ?? Number.MAX_SAFE_INTEGER
            }))
            .sort((a, b) => a.order - b.order);
        }

        setSubcategories(uniqueSubcategories);
      };

      loadOrder();
    }
  }, [serviceGroups, packages]);

  // ====== Handler pro rozbalování podkategorií ======
  const toggleSubcategory = (subcategoryName) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryName)) {
        newSet.delete(subcategoryName);
      } else {
        newSet.add(subcategoryName);
      }
      return newSet;
    });
  };

  // ====== Funkce pro přesun podkategorií ======
  const moveItem = (category, fromIndex, direction) => {
    const newItems = [...subcategories[category]];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex >= 0 && toIndex < newItems.length) {
      [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
      setSubcategories({...subcategories, [category]: newItems});
      
      // Vizuální feedback
      setMovedItem(newItems[toIndex].name);
      setTimeout(() => setMovedItem(null), 1000);
    }
  };

  // ====== Funkce pro přesun služeb v podkategorii ======
  const moveService = (category, subcategory, fromIndex, direction) => {
    const newSubcategories = { ...subcategories };
    const targetSubcat = newSubcategories[category].find(s => s.name === subcategory);
    
    if (targetSubcat && targetSubcat.items) {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      
      if (toIndex >= 0 && toIndex < targetSubcat.items.length) {
        const newItems = [...targetSubcat.items];
        [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
        targetSubcat.items = newItems;
        
        setSubcategories(newSubcategories);
        
        // Vizuální feedback
        setMovedItem(newItems[toIndex].id);
        setTimeout(() => setMovedItem(null), 1000);
      }
    }
  };

  // ====== Funkce pro uložení změn ======
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const orderData = {
        categories: {},
        services: {}
      };

      // Vytvoření struktury pro uložení
      Object.entries(subcategories).forEach(([category, items]) => {
        // Pořadí kategorií
        orderData.categories[category] = {};
        items.forEach((item, index) => {
          orderData.categories[category][item.name] = index;
        });

        // Pořadí služeb v kategoriích
        if (items.some(item => item.items)) {
          orderData.services[category] = {};
          items.forEach(item => {
            if (item.items) {
              orderData.services[category][item.name] = {};
              item.items.forEach((service, serviceIndex) => {
                orderData.services[category][item.name][service.id] = serviceIndex;
              });
            }
          });
        }
      });

      await updateSubcategoryOrder(orderData);
      alert('Pořadí bylo úspěšně uloženo');
    } catch (error) {
      console.error('Chyba při ukládání pořadí:', error);
      alert('Při ukládání pořadí došlo k chybě');
    }
    setIsLoading(false);
  };

  // ====== Render komponenty ======
  return (
    <div className="space-y-8">
      {Object.entries(subcategories).map(([category, items]) => (
        <div key={category} className="mb-6">
          {/* Hlavní kategorie s možností rozbalení */}
          <div 
            onClick={() => toggleCategory(category)}
            className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
          >
            <span className="text-gray-500 transition-transform duration-200">
              {expandedCategories.has(category) ? '▼' : '▶'}
            </span>
            <h3 className="text-lg font-semibold">
              {category === 'interior' ? 'Interiér' : 
               category === 'exterior' ? 'Exteriér' : 
               'Balíčky služeb'}
            </h3>
          </div>
          
          {/* Obsah kategorie - zobrazí se jen když je rozbalená */}
          {expandedCategories.has(category) && (
            <div className="mt-2 space-y-2 pl-4">
              {items.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  {/* Podkategorie s možností rozbalení */}
                  <div 
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-300 cursor-pointer
                      ${movedItem === item.name 
                        ? 'bg-blue-100 border-blue-300 transform scale-[1.02] shadow-lg' 
                        : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => toggleSubcategory(item.name)}
                  >
                    {/* Indikátor rozbalení podkategorie */}
                    <span className="text-gray-500 transition-transform duration-200">
                      {expandedSubcategories.has(item.name) ? '▼' : '▶'}
                    </span>
                    
                    <span className="flex-grow font-medium">{item.name}</span>
                    
                    {/* Tlačítka pro přesun - stopPropagation zabrání rozbalení při kliknutí */}
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => moveItem(category, index, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >↑</button>
                      <button 
                        onClick={() => moveItem(category, index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >↓</button>
                    </div>
                  </div>
   
                  {/* Seznam služeb - zobrazí se jen když je podkategorie rozbalená */}
                  {item.items && expandedSubcategories.has(item.name) && (
                    <div className="ml-6 space-y-1">
                      {item.items.map((service, serviceIndex) => (
                        <div 
                          key={service.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-300
                            ${movedItem === service.id 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white hover:bg-gray-50'}`}
                        >
                          <span className="flex-grow text-sm">{service.name}</span>
                          <button 
                            onClick={() => moveService(category, item.name, serviceIndex, 'up')}
                            disabled={serviceIndex === 0}
                            className="p-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >↑</button>
                          <button 
                            onClick={() => moveService(category, item.name, serviceIndex, 'down')}
                            disabled={serviceIndex === item.items.length - 1}
                            className="p-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >↓</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      <Button 
        onClick={handleSave} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Ukládání...' : 'Uložit pořadí'}
      </Button>
    </div>
   );
};

export default CategoryOrder;
