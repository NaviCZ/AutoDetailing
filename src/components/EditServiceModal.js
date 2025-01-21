import React, { useState, useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useServiceContext } from './ServiceContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

const EditServiceModal = ({ isOpen, service, onClose, onSave, onDelete }) => {
  const { serviceGroups } = useServiceContext();
  const [editedService, setEditedService] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    if (service) {
      // Ujistíme se, že máme mainCategory buď z service nebo z props
      const mainCategory = service.mainCategory || service.category;
      setEditedService({
        ...service,
        id: service.id, // Explicitně nastavíme ID
        mainCategory: mainCategory, // Explicitně nastavíme kategorii
        hourly: Boolean(service.hourly),
        hasVariants: Boolean(service.hasVariants),
        isPackage: Boolean(service.isPackage),
        variants: service.variants || [],
      });
    }
  }, [service]);

  useEffect(() => {
    if (service?.mainCategory && serviceGroups[service.mainCategory]?.items) {
      const uniqueSubcategories = [
        ...new Set(
          serviceGroups[service.mainCategory].items
            .map(item => item.subcategory)
            .filter(Boolean)
        )
      ];
      setSubcategories(uniqueSubcategories);
    }
  }, [service?.mainCategory, serviceGroups]);

  if (!editedService) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedService(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    if (!editedService.name?.trim()) {
      alert('Název služby je povinný');
      return;
    }
    if (!editedService.price || isNaN(editedService.price)) {
      alert('Cena musí být platné číslo');
      return;
    }

    const serviceToSave = {
        ...editedService,
        id: editedService.id,
        mainCategory: editedService.mainCategory,
        name: editedService.name.trim(),
        price: Number(editedService.price),
        subcategory: editedService.subcategory || '',
        hourly: Boolean(editedService.hourly),
        // Explicitně nastavíme varianty
        hasVariants: false,
        variants: [],
        isPackage: false
      };
    
      console.log('Ukládám službu:', serviceToSave);
      onSave(serviceToSave);
      onClose();
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        {/* Hlavička s nadpisem a ikonou smazání */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upravit službu</h2>
          <button
            onClick={() => {
              if (window.confirm('Opravdu chcete tuto službu smazat?')) {
                onDelete();
                onClose();
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="form-section">
            <label className="block text-sm font-medium mb-1">Název služby:</label>
            <input
              type="text"
              name="name"
              value={editedService.name || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="form-section">
            <label className="block text-sm font-medium mb-1">Podkategorie:</label>
            <select
              name="subcategory"
              value={editedService.subcategory || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Vyberte podkategorii</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label className="block text-sm font-medium mb-1">Cena (Kč):</label>
            <input
              type="number"
              name="price"
              value={editedService.price || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="form-section">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="hourly"
                checked={editedService.hourly || false}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm flex items-center">
                Hodinová sazba
                <Clock className="ml-2 h-4 w-4 text-gray-400" />
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>Zrušit</Button>
            <Button 
              onClick={() => {
                handleSave();
                onClose();
              }}
            >
              Uložit
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditServiceModal;