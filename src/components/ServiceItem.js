import React from 'react';
import { Edit2, Trash2, Clock, Plus, Minus } from 'lucide-react';

const ServiceItem = ({ 
  service, 
  isSelected, 
  onToggle, 
  onEdit, 
  onDelete,
  serviceHours,
  onHoursChange 
}) => {
  // Helper funkce pro zaokrouhlení na jedno desetinné místo
  const roundToOneDecimal = (num) => {
    return Math.round(num * 10) / 10;
  };

  const handleHoursChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      onHoursChange(service.id, '');
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onHoursChange(service.id, roundToOneDecimal(numValue));
    }
  };

  const adjustHours = (increment) => {
    const currentValue = serviceHours[service.id] || 0;
    const newValue = roundToOneDecimal(currentValue + increment);
    onHoursChange(service.id, Math.max(0, newValue));
  };

  const handleRowClick = (e) => {
    if (
      e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'BUTTON' &&
      !e.target.closest('button')
    ) {
      onToggle(service.id);
      if (service.hourly && !isSelected) {
        onHoursChange(service.id, 0.5);
      }
    }
  };

  // Formátování zobrazené hodnoty
  const displayValue = serviceHours[service.id] !== undefined && serviceHours[service.id] !== '' 
    ? roundToOneDecimal(serviceHours[service.id]).toFixed(1) 
    : '';

  return (
    <div 
      className="flex items-center justify-between py-2 hover:bg-gray-50 cursor-pointer group/item"
      onClick={handleRowClick}
    >
      <div className="flex items-center flex-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {
            onToggle(service.id);
            if (service.hourly && !isSelected) {
              onHoursChange(service.id, 0.5);
            }
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="ml-2 flex items-center">
          {service.name}
          {service.hourly && (
            <Clock className="ml-2 h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 text-gray-400 min-w-[20px] min-h-[20px]" />
          )}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {service.hourly && isSelected && (
          <div 
            className="flex items-center space-x-1 bg-gray-50 p-1 rounded" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => adjustHours(-0.1)}
              className="p-1 hover:bg-gray-200 rounded text-gray-600"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={displayValue}
              onChange={handleHoursChange}
              className="w-16 p-1 border rounded text-sm text-center"
              step="0.1"
              min="0"
              inputMode="decimal"
              placeholder="0.0"
            />
            <button
              onClick={() => adjustHours(0.1)}
              className="p-1 hover:bg-gray-200 rounded text-gray-600"
            >
              <Plus size={14} />
            </button>
            <span className="text-sm text-gray-500 whitespace-nowrap pl-1">hod</span>
          </div>
        )}
        
        <span className="font-medium whitespace-nowrap">
          {service.price?.toLocaleString()} Kč
          {service.hourly && '/hod'}
        </span>

        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(service);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Edit2 size={16} className="text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(service.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceItem;