import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Clock } from 'lucide-react';

const EditServiceModal = ({ isOpen, service, onClose, onSave }) => {
  const [editedService, setEditedService] = useState({
    ...service,
    hourly: service.hourly || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedService(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    if (!editedService.name.trim()) {
      alert('Název služby je povinný');
      return;
    }
    if (!editedService.price || isNaN(editedService.price)) {
      alert('Cena musí být platné číslo');
      return;
    }
    onSave({
      ...editedService,
      price: Number(editedService.price)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Upravit službu</h2>
        <div className="space-y-4">
          <div className="form-section">
            <label className="block text-sm font-medium mb-1">Název služby:</label>
            <input
              type="text"
              name="name"
              value={editedService.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="form-section">
            <label className="block text-sm font-medium mb-1">Cena (Kč):</label>
            <input
              type="number"
              name="price"
              value={editedService.price}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="form-section">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="hourly"
                checked={editedService.hourly}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm flex items-center">
                Hodinová sazba
                <Clock className="ml-2 h-4 w-4 text-gray-400" />
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>Zrušit</Button>
            <Button onClick={handleSave}>Uložit</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditServiceModal;