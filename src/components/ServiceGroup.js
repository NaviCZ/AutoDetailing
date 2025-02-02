// ServiceGroup.js
import React, { useState, useEffect } from 'react';
import { Edit2, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [subcategoryOrder, setSubcategoryOrder] = useState({});
  const [serviceOrder, setServiceOrder] = useState({});

  // Načtení pořadí podkategorií a služeb
  useEffect(() => {
    const database = getDatabase();
    const subcategoryOrderRef = ref(database, `settings/subcategoryOrder/${category}`);
    const serviceOrderRef = ref(database, `settings/serviceOrder/${category}`);
    
    const unsubscribeSubcategory = onValue(subcategoryOrderRef, (snapshot) => {
      if (snapshot.exists()) {
        setSubcategoryOrder(snapshot.val());
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
  }, [category]);

  const handleUpdateSubcategory = async (newName, orderedServices) => {
    try {
      const db = getDatabase();
      const updates = {};

      // Aktualizace názvu podkategorie pro každou službu
      orderedServices.forEach((service) => {
        updates[`services/${category}/items/${service.id}/subcategory`] = newName;
      });

      // Aktualizace pořadí služeb
      orderedServices.forEach((service, index) => {
        updates[`settings/serviceOrder/${category}/${newName}/${service.id}`] = index;
      });

      // Provedení aktualizace v databázi
      await update(ref(db), updates);

      // Aktualizace lokálního stavu
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

  // Seskupení a seřazení služeb
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
      return (subcategoryOrder[a] || 0) - (subcategoryOrder[b] || 0);
    });

  const getSortedServices = (services, subcategory) => {
    const orderData = serviceOrder[subcategory] || {};
    return [...services].sort((a, b) => {
      return (orderData[a.id] || 0) - (orderData[b.id] || 0);
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {category === 'interior' ? 'Interiér' :
         category === 'exterior' ? 'Exteriér' :
         category === 'package' ? 'Balíčky' : category}
      </h2>

      <div className="space-y-2">
        {sortedSubcategories.map(([subcategory, services]) => (
          <div 
            key={subcategory} 
            className={`border rounded-lg overflow-hidden ${
              !expandedSubcategories.has(subcategory) && 
              services.some(service => selectedServices.has(service.id))
                ? 'border-blue-400'
                : ''
            }`}
          >
            <div className="flex items-center justify-between p-3 relative">
              <div 
                className="flex items-center flex-1 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setExpandedSubcategories(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(subcategory)) {
                      newSet.delete(subcategory);
                    } else {
                      newSet.add(subcategory);
                    }
                    return newSet;
                  });
                }}
              >
                {expandedSubcategories.has(subcategory) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
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
              
              {expandedSubcategories.has(subcategory) && (
                <button
                  onClick={() => setEditingSubcategory(subcategory)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
              )}
            </div>

            {expandedSubcategories.has(subcategory) && (
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