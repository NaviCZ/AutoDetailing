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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
    const [activeItemId, setActiveItemId] = useState(null);
    const [editingService, setEditingService] = useState(null);

  if (!group || !group.items) return null;

  const items = Array.isArray(group.items) ? group.items : Object.values(group.items);

  const groupedBySubcategory = items.reduce((acc, service) => {
    const subcategory = service.subcategory || 'Ostatní';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(service);
    return acc;
  }, {});

  const handleEditServiceSave = async (updatedService) => {
    console.log('ServiceGroup - ukládání služby:', updatedService);
    try {
      // Přidáme mainCategory a ujistíme se, že máme všechna potřebná data
      const serviceToSave = {
        ...updatedService,
        mainCategory: category,
        id: updatedService.id || Date.now().toString(),
        hasVariants: false,
        isPackage: false,
        variants: []
      };
  
      await onEditService(category, serviceToSave);
      console.log('Služba úspěšně uložena');
      setEditingService(null);
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      alert('Nepodařilo se uložit změny: ' + error.message);
    }
  };

  return (
    <div className="space-y-2">
      <div className="group">
        <div className="flex items-center justify-between text-xl font-bold mb-4 p-2">
          <span>{category === 'interior' ? 'Interiér' : category === 'exterior' ? 'Exteriér' : category}</span>
        </div>

        <div className="space-y-2">
        {Object.entries(groupedBySubcategory).map(([subcategory, services]) => (
          <div key={subcategory} className="border rounded-lg overflow-hidden">
            <div className="relative">
              <div 
                className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
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
                <div className="flex items-center flex-1">
                  {expandedSubcategories.has(subcategory) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="ml-2 font-medium">{subcategory}</span>
                </div>

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

            {expandedSubcategories.has(subcategory) && (
              <div className="p-3 space-y-2 bg-white border-t">
                {services.map((service) => (
                  <div key={service.id}>
                    {service.hasVariants ? (
                      <ServiceVariantSelect
                        service={service}
                        selectedVariantId={selectedVariants[service.id]}
                        onSelect={(variantId) => onVariantSelect(service.id, variantId)}
                        isActive={service.id === activeItemId}
                        onEdit={() => setEditingService(service)}
                      />
                    ) : (
                      <ServiceItem
                        service={service}
                        isSelected={selectedServices.has(service.id)}
                        onToggle={(id) => {
                          onToggleService(id);
                          setActiveItemId(id);
                        }}
                        onEdit={() => setEditingService(service)}
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

      {editingService && (
  <EditServiceModal
    isOpen={true}
    service={{
      ...editingService,
      mainCategory: category // Přidáme kategorii do služby
    }}
    onClose={() => setEditingService(null)}
    onSave={handleEditServiceSave}
    onDelete={() => onDeleteService(category, editingService.id)}
  />
)}

      {editingSubcategory && (
        <EditSubcategoryModal
          isOpen={!!editingSubcategory}
          subcategory={editingSubcategory}
          onClose={() => setEditingSubcategory(null)}
          onSave={(newName) => {
            onEditSubcategory(category, editingSubcategory, newName);
            setEditingSubcategory(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceGroup;