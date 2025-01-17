import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import EditVariantsModal from './EditVariantsModal';

const ServiceVariantSelect = ({ service, selectedVariantId, onSelect, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!service.hasVariants || !service.variants?.length) {
    return null;
  }

  const selectedVariant = service.variants.find(v => v.id === selectedVariantId);

  return (
    <div className="flex items-center justify-between p-2 group">
      <div className="flex-1">
        <select
          value={selectedVariantId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full p-2 border rounded"
        >
          <option value="">Vyberte variantu</option>
          {service.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name} - {variant.price} Kč
            </option>
          ))}
        </select>
      </div>

      <div className="ml-4 flex items-center">
        {selectedVariant && (
          <span className="text-blue-600 font-bold mr-4">
            {selectedVariant.price} Kč
          </span>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 size={16} className="text-gray-600" />
        </button>
      </div>

      {isEditing && (
        <EditVariantsModal
          isOpen={isEditing}
          service={service}
          onClose={() => setIsEditing(false)}
          onSave={(updatedService) => {
            onEdit(updatedService);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
};

export default ServiceVariantSelect;