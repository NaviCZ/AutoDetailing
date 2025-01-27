import React from 'react';
import { Car, Truck } from 'lucide-react'; // Import ikon z lucide-react

const CarSizeSelector = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Velikost vozu</label>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {/* Osobní vůz */}
        <button
          type="button"
          onClick={() => onChange('M')}
          className={`p-2 border rounded-lg flex flex-col items-center transition-all ${
            value === 'M'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
          }`}
        >
          <Car
            className="w-8 h-8 mb-1"
            strokeWidth={1.5}
            color={value === 'M' ? '#3B82F6' : '#666666'}
          />
          <span className={`text-sm ${value === 'M' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
            Osobní vůz
          </span>
        </button>

        {/* Dodávka */}
        <button
          type="button"
          onClick={() => onChange('XL')}
          className={`p-2 border rounded-lg flex flex-col items-center transition-all ${
            value === 'XL'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
          }`}
        >
          <Truck
            className="w-8 h-8 mb-1"
            strokeWidth={1.5}
            color={value === 'XL' ? '#3B82F6' : '#666666'}
          />
          <span className={`text-sm ${value === 'XL' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
            SUV/Dodávka (+30%)
          </span>
        </button>
      </div>
    </div>
  );
};

export default CarSizeSelector;