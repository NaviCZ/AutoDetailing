// EditSubcategoryModal.js
import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  X as CloseIcon,
  Save
} from 'lucide-react';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { createUpdateNotification } from '../utils/notifications';

const EditSubcategoryModal = ({ 
  isOpen, 
  onClose, 
  category, 
  subcategory, 
  services,
  onUpdateSubcategory 
}) => {
  const [subcategoryName, setSubcategoryName] = useState(subcategory);
  const [orderedServices, setOrderedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingServiceId, setMovingServiceId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const loadServiceOrder = async () => {
        setLoading(true);
        try {
          const db = getDatabase();
          const orderRef = ref(db, `settings/serviceOrder/${category}/${subcategory}`);
          const snapshot = await get(orderRef);
          const orderData = snapshot.val() || {};
          
          const sortedServices = [...services].sort((a, b) => {
            return (orderData[a.id] || 0) - (orderData[b.id] || 0);
          });
          
          setOrderedServices(sortedServices);
        } catch (error) {
          console.error('Chyba při načítání pořadí:', error);
        }
        setLoading(false);
      };

      loadServiceOrder();
      setSubcategoryName(subcategory);
    }
  }, [isOpen, category, subcategory, services]);

  const moveServiceUp = async (index) => {
    if (index <= 0) return;
    
    const newOrder = [...orderedServices];
    const movingService = newOrder[index];
    setMovingServiceId(movingService.id);
    
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedServices(newOrder);
    await saveServiceOrder(newOrder);
    
    // Zrušení zvýraznění po 1 sekundě
    setTimeout(() => {
      setMovingServiceId(null);
    }, 1000);
  };

  const moveServiceDown = async (index) => {
    if (index >= orderedServices.length - 1) return;
    
    const newOrder = [...orderedServices];
    const movingService = newOrder[index];
    setMovingServiceId(movingService.id);
    
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedServices(newOrder);
    await saveServiceOrder(newOrder);
    
    // Zrušení zvýraznění po 1 sekundě
    setTimeout(() => {
      setMovingServiceId(null);
    }, 1000);
  };

  const saveServiceOrder = async (newOrder) => {
    try {
      const db = getDatabase();
      const orderObj = {};
      newOrder.forEach((service, index) => {
        orderObj[service.id] = index;
      });
      
      await set(ref(db, `settings/serviceOrder/${category}/${subcategory}`), orderObj);
        
      // Oznámení o změně pořadí - přidáme název podkategorie do hlavní zprávy
      await createUpdateNotification(
        `Změněno pořadí služeb v ${category === 'interior' ? 'Interiér' : 'Exteriér'} / ${subcategoryName}`,
        {
          type: 'reorder',
          details: {
            kategorie: category === 'interior' ? 'Interiér' : 'Exteriér',
            podkategorie: subcategoryName,
            počet_služeb: newOrder.length
          }
        }
      );
    } catch (error) {
      console.error('Chyba při ukládání pořadí:', error);
    }
  };

  const handleSave = async () => {
    try {
      const db = getDatabase();
      
      // Pokud se změnil název podkategorie, vytvoříme notifikaci o této změně
      if (subcategoryName !== subcategory) {
        await createUpdateNotification(
          `Změněn název podkategorie "${subcategory}" na "${subcategoryName}" v sekci ${category === 'interior' ? 'Interiér' : 'Exteriér'}`,
          {
            type: 'rename',
            details: {
              kategorie: category === 'interior' ? 'Interiér' : 'Exteriér',
              z: subcategory,
              na: subcategoryName
            }
          }
        );
      }
      
      // Aktualizace názvů podkategorií u všech služeb
      const updates = {};
      services.forEach(service => {
        updates[`services/${category}/items/${service.id}/subcategory`] = subcategoryName;
      });
  
      // Uložení změn do Firebase
      await update(ref(db), updates);
      
      // Callback pro aktualizaci UI
      if (onUpdateSubcategory) {
        onUpdateSubcategory(subcategoryName, orderedServices);
      }
      
      onClose();
    } catch (error) {
      console.error('Chyba při ukládání změn:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Hlavička modalu */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Upravit podkategorii</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Obsah modalu */}
        <div className="p-4 space-y-4">
          {/* Název podkategorie */}
          <div>
            <label className="block text-sm font-medium mb-1">Název podkategorie</label>
            <input
              type="text"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Seznam služeb */}
          <div>
          <label className="block text-sm font-medium mb-2">Pořadí služeb <span className="text-gray-500">(možnost měnit popořadí)</span></label>
            {loading ? (
              <div className="text-center py-4">Načítání...</div>
            ) : (
              <div className="space-y-2">
                {orderedServices.map((service, index) => (
                  <div 
                    key={service.id}
                    className={`flex items-center justify-between p-2 rounded border transition-all duration-300 ${
                      movingServiceId === service.id 
                        ? 'bg-blue-100 border-blue-400 shadow-lg transform scale-102'
                        : 'bg-gray-50'
                    }`}
                  >
                    <span>{service.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveServiceUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded transition-colors ${
                          index === 0 
                            ? 'text-gray-400' 
                            : 'hover:bg-gray-200 active:bg-gray-300'
                        }`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveServiceDown(index)}
                        disabled={index === orderedServices.length - 1}
                        className={`p-1 rounded transition-colors ${
                          index === orderedServices.length - 1 
                            ? 'text-gray-400' 
                            : 'hover:bg-gray-200 active:bg-gray-300'
                        }`}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patička modalu */}
<div className="flex justify-end gap-2 p-4 border-t">
  <button
    onClick={onClose}
    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
  >
    Zrušit
  </button>
  <button
    onClick={handleSave}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
  >
    <Save size={16} />
    Uložit
  </button>
</div>
      </div>
    </div>
  );
};

export default EditSubcategoryModal;