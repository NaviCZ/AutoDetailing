import React, { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';  // Změněno na import s destrukturací

const EditSubcategoryModal = ({ isOpen, onClose, subcategory, onSave }) => {
  const [newName, setNewName] = useState(subcategory || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Název podkategorie je povinný');
      return;
    }
    onSave(newName.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Upravit podkategorii</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Název podkategorie
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Zadejte název podkategorie"
          />
        </div>

        <div className="flex justify-end space-x-2">
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

export default EditSubcategoryModal;