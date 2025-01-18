import React from 'react';
import { Edit2, Clock, Plus, Minus } from 'lucide-react';

const ServiceItem = ({ 
  service, 
  isSelected, 
  onToggle,
  onEdit,
  serviceHours = {},
  onHoursChange,
  isActive 
}) => {
  if (!service) return null;

  const handleHoursChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      onHoursChange(service.id, '');
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onHoursChange(service.id, numValue);
    }
  };

  const adjustHours = (increment) => {
    const currentValue = serviceHours[service.id] || 0;
    const newValue = Math.max(0, (currentValue + increment));
    const roundedValue = Math.round(newValue * 10) / 10;
    onHoursChange(service.id, roundedValue);
  };

  const handleClick = () => {
    if (!isSelected && service.hourly) {
      onHoursChange(service.id, 0.5);
    }
    onToggle(service.id);
  };

  // Formátování zobrazené hodnoty
  const displayValue = serviceHours[service.id] !== undefined && serviceHours[service.id] !== '' 
    ? (Math.round(serviceHours[service.id] * 10) / 10).toFixed(1) 
    : '';

  return (
    <div 
      className={`py-2 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors duration-150`}
      onClick={handleClick}
    >
      <div className="flex flex-col">
        {/* První řádek s checkboxem, názvem a cenou */}
        <div className="flex items-center">
          <div className="flex items-start flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleClick}
              className="h-4 w-4 mt-1 rounded border-gray-300"
              onClick={e => e.stopPropagation()}
            />
            <span className="ml-2 flex-1 min-w-0">
              {service.name}
              {service.hourly && (
                <Clock className="inline-block ml-2 h-4 w-4 text-gray-400 min-w-[20px] min-h-[20px] align-text-bottom" />
              )}
            </span>
          </div>

          <span className="font-medium whitespace-nowrap min-w-[80px] text-right">
            {service.price?.toLocaleString()} Kč
            {service.hourly && '/hod'}
          </span>
        </div>

        {/* Druhý řádek s ovládacími prvky - zobrazí se pouze pro aktivní službu */}
        {isSelected && isActive && (
          <div className="flex justify-end items-center gap-4 mt-2">
            {service.hourly && (
              <div 
                className="flex items-center gap-1 bg-white p-1 rounded border" 
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => adjustHours(-0.1)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
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
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                >
                  <Plus size={14} />
                </button>
                <span className="text-sm text-gray-500 whitespace-nowrap pl-1">hod</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(service);
              }}
              className="p-2 hover:bg-white rounded border"
            >
              <Edit2 size={16} className="text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceItem;