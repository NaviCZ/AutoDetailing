import React, { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import ServiceItem from './ServiceItem';
import ServiceVariantSelect from './ServiceVariantSelect';
import EditServiceModal from './EditServiceModal';
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
  onEditGroup,
  onDeleteGroup,
  onEditSubcategory,
  onDeleteSubcategory,
  serviceHours,
  onHoursChange
}) => {
  // ====== State management ======
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);

  if (!group || !group.items) return null;

  // ====== Data processing ======
  // Převedení položek na pole, pokud nejsou
  const items = Array.isArray(group.items) ? group.items : Object.values(group.items);

  // Seskupení služeb podle podkategorií
  const groupedBySubcategory = items.reduce((acc, service) => {
    const subcategory = service.subcategory || 'Ostatní';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(service);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {/* ====== Hlavička kategorie ====== */}
      <div className="group">
        <div className="flex items-center justify-between text-xl font-bold mb-4 p-2">
          <span>
            {category === 'interior' ? 'Interiér' : 
             category === 'exterior' ? 'Exteriér' : 
             category}
          </span>
        </div>

        {/* ====== Seznam podkategorií ====== */}
        <div className="space-y-2">
          {Object.entries(groupedBySubcategory).map(([subcategory, services]) => (
            <div 
              key={subcategory} 
              className={`border rounded-lg overflow-hidden ${
                // Zvýraznění pokud jsou vybrané služby a kategorie je sbalená
                !expandedSubcategories.has(subcategory) && 
                services.some(service => selectedServices.has(service.id))
                  ? 'border-blue-400'
                  : ''
              }`}
            >
              {/* ====== Hlavička podkategorie ====== */}
              <div className="relative">
                <div 
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                    !expandedSubcategories.has(subcategory) && 
                    services.some(service => selectedServices.has(service.id))
                      ? 'bg-blue-50'
                      : ''
                  }`}
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
                  {/* Název podkategorie a indikátor rozbalení */}
                  <div className="flex items-center flex-1">
                    {expandedSubcategories.has(subcategory) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="ml-2 font-medium">{subcategory}</span>

                    {/* Badge s počtem vybraných služeb */}
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

                  {/* Tlačítko pro editaci podkategorie */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSubcategory(subcategory);
                    }}
                    className="p-2 hover:bg-white rounded border opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* ====== Seznam služeb v podkategorii ====== */}
              {expandedSubcategories.has(subcategory) && (
                <div className="p-3 space-y-2 bg-white border-t">
                  {services.map((service) => (
                    <div key={service.id}>
                      {service.hasVariants ? (
                        // Komponenta pro služby s variantami
                        <ServiceVariantSelect
                          service={service}
                          selectedVariantId={selectedVariants[service.id]}
                          onSelect={(variantId) => onVariantSelect(service.id, variantId)}
                          isActive={service.id === activeItemId}
                          onEdit={() => onEditService(service)}
                        />
                      ) : (
                        // Standardní služba
                        <ServiceItem
                          service={service}
                          isSelected={selectedServices.has(service.id)}
                          onToggle={(id) => {
                            onToggleService(id);
                            setActiveItemId(id);
                          }}
                          onEdit={() => onEditService(service)}
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
      </div>

      {/* ====== Modální okna ====== */}
      {/* Modal pro editaci podkategorie */}
      {editingSubcategory && (
        <EditSubcategoryModal
          isOpen={!!editingSubcategory}
          subcategory={editingSubcategory}
          onClose={() => setEditingSubcategory(null)}
          onSave={(newName) => {
            onEditSubcategory(category, editingSubcategory, newName);
            setEditingSubcategory(null);
          }}
          onDelete={() => {
            onDeleteSubcategory(category, editingSubcategory);
            setEditingSubcategory(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceGroup;