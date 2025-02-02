import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { ArrowUp, ArrowDown, X, Trash2 } from 'lucide-react';
import { createUpdateNotification, trackPackageChanges, createPackageDeleteNotification } from '../utils/notifications';
import { deleteProductFromFirebase } from './Firebase';

const EditPackageModal = ({ isOpen, onClose, package: packageData, services, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: packageData?.name || '',
    price: packageData?.price || '',
    description: packageData?.description || '',
    selectedServices: [],
    discount: '' // Sleva v procentech
  });


  // Výpočet celkové hodnoty služeb
  const calculateTotalServicesPrice = () => {
    return formData.selectedServices.reduce((total, serviceId) => {
      const service = findServiceById(serviceId);
      return total + (service?.price || 0);
    }, 0);
  };


  // Výpočet slevy v Kč
  const calculateDiscountAmount = () => {
    const totalPrice = calculateTotalServicesPrice();
    if (formData.discount !== null && !isNaN(formData.discount)) {
      return Math.round(totalPrice * (formData.discount / 100));
    }
    return 0;
  };

  // Aktualizace ceny podle slevy
  const updatePriceBasedOnDiscount = (discount) => {
    const totalPrice = calculateTotalServicesPrice();
    const newPrice = Math.round(totalPrice * (1 - (discount / 100)));
    setFormData(prev => ({
      ...prev,
      price: newPrice
    }));
  };

  // Při načtení balíčku vypočítáme původní slevu
  useEffect(() => {
    if (packageData?.services) {
      const totalPrice = packageData.services.reduce((total, serviceId) => {
        const service = findServiceById(serviceId);
        return total + (service?.price || 0);
      }, 0);
      
      // Výpočet skutečné slevy v procentech
      const discountPercentage = totalPrice > 0 
        ? Math.round((1 - (packageData.price / totalPrice)) * 100) 
        : 0;

      setFormData(prev => ({
        ...prev,
        name: packageData.name || '',
        price: packageData.price || totalPrice,
        description: packageData.description || '',
        selectedServices: [...packageData.services],
        discount: discountPercentage.toString() // Nastavíme vypočtenou slevu místo 0
      }));
    }
  }, [packageData]);

  // Funkce pro aktualizaci ceny při změně slevy
  const handleDiscountChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    let newDiscount = value === '' ? 0 : parseInt(value, 10);
    
    // Omezení na rozsah 0-100
    if (newDiscount > 100) newDiscount = 100;
    if (newDiscount < 0) newDiscount = 0;

    setFormData(prev => ({
      ...prev,
      discount: newDiscount
    }));
    updatePriceBasedOnDiscount(newDiscount);
  };

  const handlePriceChange = (e) => {
    const newPrice = parseInt(e.target.value, 10);
    const totalPrice = calculateTotalServicesPrice();
    let newDiscount = Math.round((1 - (newPrice / totalPrice)) * 100);
    
    // Omezení na rozsah 0-100
    if (newDiscount > 100) newDiscount = 100;
    if (newDiscount < 0) newDiscount = 0;

    setFormData(prev => ({
      ...prev,
      price: newPrice,
      discount: newDiscount
    }));
  };

// Handler pro změnu výsledné ceny
const handleFinalPriceChange = (e) => {
  const newPrice = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
  const totalPrice = calculateTotalServicesPrice();
  const newDiscount = Math.round((1 - (newPrice / totalPrice)) * 100);
  
  // Omezení na rozsah 0-100
  const clampedDiscount = Math.min(100, Math.max(0, newDiscount));
  
  setFormData(prev => ({
    ...prev,
    price: newPrice,
    discount: clampedDiscount
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.name.trim()) {
    alert('Název balíčku je povinný');
    return;
  }
  if (!formData.price || isNaN(formData.price)) {
    alert('Cena musí být platné číslo');
    return;
  }
  
  const updatedPackage = {
    id: packageData.id,
    name: formData.name.trim(),
    price: Number(formData.price),
    description: formData.description.trim() || '',
    services: formData.selectedServices,
    hasVariants: false,
    hourly: false,
    isPackage: true,
    mainCategory: 'package',
    subcategory: 'package',
    active: true,
    categoryId: 'package',
    createdAt: packageData.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  
  await onSave(updatedPackage);

  const notification = trackPackageChanges(packageData, updatedPackage);
  if (notification) {
    await createUpdateNotification(notification.message, notification.changes);
  }
    
    onSave(updatedPackage);
  };
    
  
  const toggleService = (serviceId) => {
    setFormData(prev => {
      const newServices = [...prev.selectedServices];
      if (newServices.includes(serviceId)) {
        return {
          ...prev,
          selectedServices: newServices.filter(id => id !== serviceId)
        };
      } else {
        return {
          ...prev,
          selectedServices: [...newServices, serviceId]
        };
      }
    });
  };
  const [movedServiceId, setMovedServiceId] = useState(null);

  const moveService = (index, direction) => {
  const newServices = [...formData.selectedServices];
  const newIndex = direction === 'up' ? index - 1 : index + 1;

  if (newIndex >= 0 && newIndex < newServices.length) {
    const movedService = newServices[index];
    newServices[index] = newServices[newIndex];
    newServices[newIndex] = movedService;

    // Nastavíme ID přesunuté služby pro animaci
    setMovedServiceId(movedService);
    setTimeout(() => setMovedServiceId(null), 800); // Zrušíme zvýraznění po 800ms

    setFormData(prev => ({
      ...prev,
      selectedServices: newServices
    }));
  }
};

  const findServiceById = (serviceId) => {
    for (const [_, categoryData] of Object.entries(services)) {
      const found = categoryData.items?.find(service => service.id === serviceId);
      if (found) return found;
    }
    return null;
  };
  
  
  
  const handleDelete = async () => {
    if (window.confirm('Opravdu chcete smazat tento balíček?')) {
      try {
        console.log('Začínám mazání balíčku:', packageData);
        const success = await deleteProductFromFirebase(packageData.id);
        console.log('Výsledek mazání:', success);
        
        if (success) {
          console.log('Vytvářím notifikaci o smazání');
          await createPackageDeleteNotification(packageData);
          console.log('Notifikace vytvořena');
          
          if (onDelete) {
            await onDelete(packageData.id);
          }
          onClose();
        } else {
          alert('Při mazání balíčku došlo k chybě');
        }
      } catch (error) {
        console.error('Chyba při mazání balíčku:', error);
        alert('Při mazání balíčku došlo k chybě: ' + error.message);
      }
    }
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hlavička s křížkem a košem */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upravit balíček služeb</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              type="button"
              className="text-red-500 hover:text-red-600 transition-colors"
              title="Smazat balíček"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="text-gray-500 hover:text-gray-700"
              title="Zavřít"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Základní informace */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Název balíčku</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Cenová sekce - nyní v šedém boxu */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {/* Výsledná cena */}
            <div className="text-center mb-4">
              <label className="text-sm text-gray-600">Výsledná cena balíčku</label>
              <div className="flex items-center justify-center">
                <input
                  type="text"
                  value={formData.price.toLocaleString('cs-CZ')}
                  onChange={handleFinalPriceChange}
                  className="w-28 p-1.5 border rounded text-lg font-medium text-center"
                />
                <span className="ml-1">Kč</span>
              </div>
            </div>
            
            {/* Sleva a Celková hodnota na jednom řádku */}
            <div className="flex items-center gap-6">
              <div className="flex-1 text-center">
                <label className="text-sm text-gray-600">Sleva</label>
                <div className="flex items-center justify-center">
                  <input
                    type="text"
                    value={formData.discount === 0 ? '0' : formData.discount}
                    onChange={handleDiscountChange}
                    className="w-16 p-1.5 border rounded text-sm text-center"
                  />
                  <span className="mx-1">%</span>
                  <span className="text-sm text-gray-500">
                    ({calculateDiscountAmount().toLocaleString('cs-CZ')} Kč)
                  </span>
                </div>
              </div>

              <div className="flex-1 text-center">
                <label className="text-sm text-gray-600">Celková hodnota služeb</label>
                <div className="text-sm">
                  {calculateTotalServicesPrice().toLocaleString('cs-CZ')} Kč
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Popis</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
        </div>

        {/* Seznam vybraných služeb s možností řazení */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Vybrané služby a jejich pořadí</h3>
          <div className="space-y-2">
            {formData.selectedServices.map((serviceId, index) => {
              const service = findServiceById(serviceId);
              if (!service) return null;
              
              return (
    <div 
      key={serviceId}
      className={`
        flex items-center justify-between p-3 rounded border
        transition-all duration-300 ease-in-out
        ${movedServiceId === serviceId 
          ? 'bg-blue-50 border-blue-400 shadow-md scale-102 transform'
          : 'bg-white hover:border-blue-200'}
      `}
    >
      <div className="flex items-center gap-2">
        <span className={`
          transition-colors duration-300
          ${movedServiceId === serviceId ? 'text-blue-600' : 'text-gray-500'}
        `}>
          {index + 1}.
        </span>
        <span>{service.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => moveService(index, 'up')}
          disabled={index === 0}
          className={`
            transition-colors duration-200
            ${index === 0 
              ? 'text-gray-300'
              : 'text-gray-500 hover:text-blue-600 active:text-blue-700'}
          `}
          title="Posunout nahoru"
        >
          <ArrowUp size={18} />
        </button>
        <button
          type="button"
          onClick={() => moveService(index, 'down')}
          disabled={index === formData.selectedServices.length - 1}
          className={`
            transition-colors duration-200
            ${index === formData.selectedServices.length - 1
              ? 'text-gray-300'
              : 'text-gray-500 hover:text-blue-600 active:text-blue-700'}
          `}
          title="Posunout dolů"
        >
          <ArrowDown size={18} />
        </button>
        <button
          type="button"
          onClick={() => toggleService(serviceId)}
          className="text-gray-500 hover:text-red-600 ml-2 transition-colors duration-200"
          title="Odebrat službu"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
})}
            {formData.selectedServices.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                Zatím nejsou vybrány žádné služby
              </div>
            )}
          </div>
        </div>

        {/* Seznam dostupných služeb */}
        <div className="border rounded-lg p-4">
    <h3 className="font-medium mb-2">Dostupné služby</h3>
    <div className="max-h-60 overflow-y-auto space-y-4">
      {Object.entries(services)
        .sort(([categoryA], [categoryB]) => {
          // "interior" bude vždy první
          if (categoryA === 'interior') return -1;
          if (categoryB === 'interior') return 1;
          // ostatní kategorie řadíme abecedně
          return categoryA.localeCompare(categoryB);
        })
        .map(([category, categoryServices]) => {
          // Seřadíme služby podle názvu
          const sortedServices = [...(categoryServices.items || [])].sort((a, b) => 
            a.name.localeCompare(b.name)
          );

          return (
            <div key={category}>
              <h4 className="font-medium capitalize mb-2">
                {category === 'interior' ? 'Interiér' : 
                 category === 'exterior' ? 'Exteriér' : category}
              </h4>
              <div className="space-y-1">
                {sortedServices.map(service => (
                  <div 
                    key={service.id} 
                    onClick={() => toggleService(service.id)}
                    className={`
                      flex items-center p-2 rounded cursor-pointer
                      ${formData.selectedServices.includes(service.id) 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedServices.includes(service.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleService(service.id);
                      }}
                      className="mr-2"
                    />
                    <span>{service.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Zrušit
          </Button>
          <Button type="submit">
            Uložit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPackageModal;