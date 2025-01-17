import React, { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';

const EditPackageModal = ({ isOpen, onClose, package: packageData, services, onSave }) => {
  const [formData, setFormData] = useState({
    name: packageData?.name || '',
    price: packageData?.price || '',
    description: packageData?.description || '',
    selectedServices: new Set(packageData?.services || [])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Název balíčku je povinný');
      return;
    }
    if (!formData.price || isNaN(formData.price)) {
      alert('Cena musí být platné číslo');
      return;
    }

    onSave({
      ...packageData,
      name: formData.name.trim(),
      price: Number(formData.price),
      description: formData.description.trim(),
      services: Array.from(formData.selectedServices)
    });
  };

  const toggleService = (serviceId) => {
    setFormData(prev => {
      const newSelected = new Set(prev.selectedServices);
      if (newSelected.has(serviceId)) {
        newSelected.delete(serviceId);
      } else {
        newSelected.add(serviceId);
      }
      return { ...prev, selectedServices: newSelected };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Upravit balíček služeb</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Název balíčku</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Cena (Kč)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Popis</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Obsažené služby</label>
            <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-2">
              {Object.entries(services).map(([category, categoryServices]) => (
                <div key={category}>
                  <h3 className="font-medium">{category}</h3>
                  {categoryServices.items?.map(service => (
                    <div key={service.id} className="ml-4 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedServices.has(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="rounded"
                      />
                      <span>{service.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
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