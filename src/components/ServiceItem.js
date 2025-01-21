import React, { useState } from 'react';
import { Edit2, Clock, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react';

const ServiceItem = ({ 
  service, 
  isSelected, 
  onToggle,
  onEdit,
  serviceHours = {},
  onHoursChange,
  isActive 
}) => {
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  
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

  const displayValue = serviceHours[service.id] !== undefined && serviceHours[service.id] !== '' 
    ? (Math.round(serviceHours[service.id] * 10) / 10).toFixed(1) 
    : '';

  return (
    <div 
      className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors duration-150`}
      onClick={handleClick}
    >
      <div className="p-2">
        {service.hourly ? (
          <div className="flex flex-col gap-1">
            {/* Horní řádek s checkboxem a názvem */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleClick}
                className="h-4 w-4 mt-1 rounded border-gray-300"
                onClick={e => e.stopPropagation()}
              />
              <div className="flex items-start gap-1 flex-grow">
                <span className="break-words">{service.name}</span>
                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
              </div>
              {!isSelected && (
                <div className="font-medium whitespace-nowrap text-right">
                  {service.price?.toLocaleString()} Kč/hod
                </div>
              )}
            </div>

            {/* Spodní řádek s hodinovou sazbou a cenou - pouze když je vybraná */}
            {isSelected && (
              <div className="flex items-center justify-end gap-2 pl-6">
                <div 
                  className="flex items-center bg-white rounded border" 
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => adjustHours(-0.1)}
                    className="p-1 hover:bg-gray-100 rounded-l text-gray-600"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={displayValue}
                    onChange={handleHoursChange}
                    className="w-12 p-1 text-sm text-center"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    placeholder="0.0"
                  />
                  <button
                    onClick={() => adjustHours(0.1)}
                    className="p-1 hover:bg-gray-100 text-gray-600"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-sm text-gray-500 px-1">hod</span>
                </div>
                {isActive && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      console.log('Klik na edit tlačítko:', service);
      if (typeof onEdit === 'function') {
        onEdit(service.mainCategory, service);
      }
    }}
    className="p-1 hover:bg-white rounded border"
  >
    <Edit2 size={16} className="text-gray-600" />
  </button>
)}
                <div className="font-medium whitespace-nowrap text-right">
                  {service.price?.toLocaleString()} Kč/hod
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleClick}
              className="h-4 w-4 mt-1 rounded border-gray-300"
              onClick={e => e.stopPropagation()}
            />
            <span className="break-words flex-grow">{service.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
            {isSelected && isActive && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (typeof onEdit === 'function') {
        onEdit(service.mainCategory, service);
      }
    }}
    className="p-1 hover:bg-white rounded border"
  >
    <Edit2 size={16} className="text-gray-600" />
  </button>
)}
  <div className="font-medium whitespace-nowrap text-right">
    {service.price?.toLocaleString()} Kč
  </div>
</div>
          </div>
        )}
      </div>

      {/* Detail balíčku */}
      {showPackageDetails && service.isPackage && (
        <div className="pl-8 pr-4 pb-2 text-sm border-t">
          {service.items?.map((item, index) => (
            <div key={index} className="flex justify-between py-1 text-gray-600">
              <span className="pr-4">• {item.name}</span>
              <span>{item.price} Kč</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between font-medium">
              <span>Celková hodnota služeb:</span>
              <span>{service.totalPrice} Kč</span>
            </div>
            <div className="flex justify-between text-blue-600 font-medium">
              <span>Cena balíčku se slevou {service.discount}%:</span>
              <span>{Math.round(service.totalPrice * (1 - service.discount / 100))} Kč</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceItem;