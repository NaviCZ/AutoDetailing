import React, { useState, useEffect } from 'react';
import { Edit2, ChevronDown, ChevronRight, ChevronUp, MoreVertical, Check } from 'lucide-react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import ServiceItem from './ServiceItem';
import ServiceVariantSelect from './ServiceVariantSelect';
import EditSubcategoryModal from './EditSubcategoryModal';

const ServiceGroup = ({
  category,
  group,
  onToggleService,
  onEditService,
  onDeleteService,
  selectedServices,
  selectedVariants,
  onVariantSelect,
  serviceHours,
  onHoursChange
}) => {
  // Základní stavy komponenty
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [subcategoryOrder, setSubcategoryOrder] = useState({});
  const [serviceOrder, setServiceOrder] = useState({});
  const [isReorderMode, setIsReorderMode] = useState(false);
  // State pro animaci přesunu
  const [movedSubcategory, setMovedSubcategory] = useState(null);

  // Načtení dat z Firebase
  useEffect(() => {
    const database = getDatabase();
    const subcategoryOrderRef = ref(database, `settings/subcategoryOrder/${category}`);
    const serviceOrderRef = ref(database, `settings/serviceOrder/${category}`);
    
    const unsubscribeSubcategory = onValue(subcategoryOrderRef, (snapshot) => {
      if (snapshot.exists()) {
        setSubcategoryOrder(snapshot.val());
      } else {
        // Pokud neexistuje pořadí, vytvoříme výchozí
        const initialOrder = {};
        if (group?.items) {
          const items = Array.isArray(group.items) ? group.items : Object.values(group.items);
          const subcats = new Set(items.map(item => item.subcategory || 'Ostatní'));
          [...subcats].forEach((subcat, index) => {
            initialOrder[subcat] = index;
          });
          setSubcategoryOrder(initialOrder);
          update(subcategoryOrderRef, initialOrder);
        }
      }
    });

    const unsubscribeService = onValue(serviceOrderRef, (snapshot) => {
      if (snapshot.exists()) {
        setServiceOrder(snapshot.val());
      }
    });

    return () => {
      unsubscribeSubcategory();
      unsubscribeService();
    };
  }, [category, group]);

  // Funkce pro přesun podkategorie
  const moveSubcategory = async (subcategory, direction) => {
    const currentOrder = { ...subcategoryOrder };
    const entries = Object.entries(currentOrder)
      .sort(([, a], [, b]) => a - b);

    const currentIndex = entries.findIndex(([name]) => name === subcategory);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= entries.length) return;

    const newOrder = {};
    entries.forEach(([name, order], index) => {
      if (index === currentIndex) {
        return;
      }
      if (index === newIndex) {
        newOrder[subcategory] = index;
        newOrder[entries[index][0]] = direction === 'up' ? index + 1 : index - 1;
      } else {
        newOrder[name] = index;
      }
    });

    try {
      // Nastavíme zvýraznění
      setMovedSubcategory(subcategory);
      setTimeout(() => setMovedSubcategory(null), 800);

      const db = getDatabase();
      await update(ref(db, `settings/subcategoryOrder/${category}`), newOrder);
    } catch (error) {
      console.error('Chyba při aktualizaci pořadí:', error);
    }
  };

  // Handler pro aktualizaci podkategorie
  const handleUpdateSubcategory = async (newName, orderedServices) => {
    try {
      const db = getDatabase();
      const updates = {};

      orderedServices.forEach((service) => {
        updates[`services/${category}/items/${service.id}/subcategory`] = newName;
      });

      orderedServices.forEach((service, index) => {
        updates[`settings/serviceOrder/${category}/${newName}/${service.id}`] = index;
      });

      await update(ref(db), updates);

      setExpandedSubcategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(editingSubcategory)) {
          newSet.delete(editingSubcategory);
          newSet.add(newName);
        }
        return newSet;
      });

    } catch (error) {
      console.error('Chyba při aktualizaci podkategorie:', error);
    }
  };

  if (!group || !group.items) return null;

  // Příprava a seřazení dat
  const items = Array.isArray(group.items) ? group.items : Object.values(group.items);
  const groupedBySubcategory = items.reduce((acc, service) => {
    const subcategory = service.subcategory || 'Ostatní';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(service);
    return acc;
  }, {});

  const sortedSubcategories = Object.entries(groupedBySubcategory)
    .sort(([a], [b]) => {
      const orderA = subcategoryOrder[a] ?? Number.MAX_SAFE_INTEGER;
      const orderB = subcategoryOrder[b] ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

  const getSortedServices = (services, subcategory) => {
    const orderData = serviceOrder[subcategory] || {};
    return [...services].sort((a, b) => {
      return (orderData[a.id] || 0) - (orderData[b.id] || 0);
    });
  };

  return (
    <div className="space-y-4">
      {/* Hlavička kategorie s tlačítkem pro řazení */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {category === 'interior' ? 'Interiér' :
           category === 'exterior' ? 'Exteriér' :
           category === 'package' ? 'Balíčky' : category}
        </h2>
        
        <button
          onClick={() => setIsReorderMode(!isReorderMode)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title={isReorderMode ? "Ukončit řazení" : "Seřadit podkategorie"}
        >
          {isReorderMode ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <MoreVertical className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Seznam podkategorií */}
      <div className="space-y-2">
        {sortedSubcategories.map(([subcategory, services]) => (
          <div 
            key={subcategory} 
            className={`
              border rounded-lg overflow-hidden
              transition-all duration-300 ease-in-out
              ${isReorderMode ? 'bg-gray-50' : ''}
              ${movedSubcategory === subcategory 
                ? 'bg-blue-50 border-blue-400 shadow-md transform scale-[1.02] z-10' 
                : 'hover:border-blue-200'}
              ${!expandedSubcategories.has(subcategory) && 
                services.some(service => selectedServices.has(service.id))
                  ? 'border-blue-400'
                  : ''}
            `}
          >
            {/* Hlavička podkategorie */}
            <div 
              className={`
                flex items-center justify-between p-3 relative
                transition-colors duration-300
                ${movedSubcategory === subcategory ? 'bg-blue-50' : ''}
              `}
            >
              <div 
                className={`
                  flex items-center flex-1 
                  ${!isReorderMode ? 'hover:bg-gray-50 cursor-pointer' : ''}
                  ${movedSubcategory === subcategory ? 'text-blue-600' : ''}
                `}
                onClick={() => {
                  if (!isReorderMode) {
                    setExpandedSubcategories(prev => {
                      const newSet = new Set(prev);
                      newSet[newSet.has(subcategory) ? 'delete' : 'add'](subcategory);
                      return newSet;
                    });
                  }
                }}
              >
                {!isReorderMode && (
                  expandedSubcategories.has(subcategory) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )
                )}
                <span className="ml-2 font-medium">{subcategory}</span>

                {!expandedSubcategories.has(subcategory) && (
                  <div className="ml-2">
                    {(() => {
                      const selectedCount = services.filter(service => 
                        selectedServices.has(service.id)
                      ).length;
                      if (selectedCount > 0) {
                        return (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {selectedCount}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
              
              {/* Ovládací prvky pro řazení a editaci */}
              <div className="flex items-center">
                {isReorderMode ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveSubcategory(subcategory, 'up')}
                      className={`
                        p-1.5 rounded transition-colors duration-200
                        ${subcategoryOrder[subcategory] === 0 
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:text-blue-700'}
                      `}
                      disabled={subcategoryOrder[subcategory] === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSubcategory(subcategory, 'down')}
                      className={`
                        p-1.5 rounded transition-colors duration-200
                        ${subcategoryOrder[subcategory] === sortedSubcategories.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:text-blue-700'}
                      `}
                      disabled={subcategoryOrder[subcategory] === sortedSubcategories.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  expandedSubcategories.has(subcategory) && (
                    <button
                      onClick={() => setEditingSubcategory(subcategory)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Seznam služeb v podkategorii */}
            {!isReorderMode && expandedSubcategories.has(subcategory) && (
              <div className="bg-white border-t p-3 space-y-2">
                {getSortedServices(services, subcategory).map((service) => (
                  <div key={service.id}>
                    {service.hasVariants ? (
                      <ServiceVariantSelect
                        service={service}
                        category={category}
                        selectedVariantId={selectedVariants[service.id]}
                        onSelect={(variantId) => onVariantSelect(service.id, variantId)}
                        isActive={service.id === activeItemId}
                        onEdit={onEditService}
                      />
                    ) : (
                      <ServiceItem
                        service={{...service, mainCategory: category}}
                        isSelected={selectedServices.has(service.id)}
                        onToggle={(id) => {
                          onToggleService(id);
                          setActiveItemId(id);
                        }}
                        onEdit={onEditService}
                        serviceHours={serviceHours}
                        onHoursChange={onHoursChange}
                        isActive={service.id === activeItemId}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal pro editaci podkategorie */}
      {editingSubcategory && (
        <EditSubcategoryModal
          isOpen={!!editingSubcategory}
          onClose={() => setEditingSubcategory(null)}
          category={category}
          subcategory={editingSubcategory}
          services={groupedBySubcategory[editingSubcategory] || []}
          onUpdateSubcategory={handleUpdateSubcategory}
        />
      )}
    </div>
  );
};

export default ServiceGroup;