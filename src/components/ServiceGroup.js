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
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer group"
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
                  
                  <div className="absolute right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSubcategory(subcategory);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Opravdu chcete smazat podkategorii "${subcategory}" a všechny její služby?`)) {
                          onDeleteSubcategory(category, subcategory);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
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
                        />
                      ) : (
                        <ServiceItem
                          service={service}
                          isSelected={selectedServices.has(service.id)}
                          onToggle={onToggleService}
                          onEdit={onEditService}
                          onDelete={() => onDeleteService(category, service.id)}
                          serviceHours={serviceHours}
                          onHoursChange={onHoursChange}
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

      {isEditModalOpen && (
        <EditServiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          service={group}
          onSave={(editedGroup) => {
            onEditGroup(category, editedGroup);
            setIsEditModalOpen(false);
          }}
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