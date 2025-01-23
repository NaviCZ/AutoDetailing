// AddServiceModal.js
// Komponenta pro přidání nové služby do systému
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Clock } from 'lucide-react';

const AddServiceModal = ({ onSave, onClose, serviceGroups = {} }) => {
  // Základní stav formuláře
  const [formData, setFormData] = useState({
    mainCategory: 'interior',
    subcategory: '',
    isNewSubcategory: false,  
    newSubcategory: '',
    isPackage: false,
    selectedServices: new Set(),
    name: '',
    price: '',
    hourly: false
  });

  // Načtení podkategorií pro vybranou kategorii
  const [subcategories, setSubcategories] = useState([]);

  // Aktualizace podkategorií při změně hlavní kategorie 
  useEffect(() => {
    if (formData.mainCategory !== 'package') {
      const categoryData = serviceGroups[formData.mainCategory];
      if (categoryData && categoryData.items) {
        const uniqueSubcategories = [
          ...new Set(categoryData.items.map(item => item.subcategory).filter(Boolean))
        ];
        setSubcategories(uniqueSubcategories);
      } else {
        setSubcategories([]);
      }
    }
  }, [formData.mainCategory, serviceGroups]);

  // Zpracování změn ve formuláři
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Přepínání služeb v balíčku
  const handleServiceToggle = (serviceId) => {
    const newSelected = new Set(formData.selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setFormData(prev => ({
      ...prev,
      selectedServices: newSelected
    }));
  };

  // Validace a uložení služby
  const handleSave = () => {
    // Validace formuláře
    if (!formData.isNewSubcategory && !formData.subcategory && formData.mainCategory !== 'package') {
      alert('Vyberte nebo vytvořte podkategorii');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('Název služby je povinný');
      return;
    }
    if (!formData.price || isNaN(formData.price)) {
      alert('Cena musí být platné číslo');
      return;
    }

    // Vytvoření nové služby
    const newService = {
      id: Date.now().toString(),
      mainCategory: formData.mainCategory,
      subcategory: formData.isNewSubcategory ? formData.newSubcategory : formData.subcategory || '',
      isPackage: formData.mainCategory === 'package',
      name: formData.name,
      price: Number(formData.price),
      hourly: formData.hourly,
      services: formData.mainCategory === 'package' ? Array.from(formData.selectedServices) : []
    };

    onSave(formData.mainCategory, newService);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Přidat novou službu</h2>
      <div className="space-y-4">
        {/* Výběr hlavní kategorie */}
        <div className="form-section">
          <label className="block text-sm font-medium mb-1">Hlavní kategorie:</label>
          <select
            name="mainCategory"
            value={formData.mainCategory}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="interior">Interiér</option>
            <option value="exterior">Exteriér</option>
            <option value="package">Balíček služeb</option>
          </select>
        </div>

        {/* Formulář pro běžnou službu */}
        {formData.mainCategory !== 'package' && (
          <>
            <div className="form-section">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isNewSubcategory"
                  checked={formData.isNewSubcategory}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm">Vytvořit novou podkategorii</span>
              </label>
            </div>

            {/* Volba podkategorie */}
            {formData.isNewSubcategory ? (
              <div className="form-section">
                <label className="block text-sm font-medium mb-1">Název podkategorie:</label>
                <input
                  type="text"
                  name="newSubcategory"
                  value={formData.newSubcategory}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            ) : (
              <div className="form-section">
                <label className="block text-sm font-medium mb-1">Podkategorie:</label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Vyberte podkategorii</option>
                  {subcategories.map((subcategory, index) => (
                    <option key={index} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Název a cena služby */}
            <div className="form-section">
              <label className="block text-sm font-medium mb-1">Název služby:</label>
              <textarea
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded resize-none overflow-hidden"
                style={{
                  minHeight: '2.5rem',
                  height: 'auto'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                rows={1}
              />
            </div>

            <div className="form-section">
              <label className="block text-sm font-medium mb-1">Cena (Kč):</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Volba hodinové sazby */}
            <div className="form-section">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="hourly"
                  checked={formData.hourly}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm flex items-center">
                  Hodinová sazba
                  <Clock className="ml-2 h-4 w-4 text-gray-400" />
                </span>
              </label>
            </div>
          </>
        )}

        {/* Formulář pro balíček služeb */}
        {formData.mainCategory === 'package' && (
          <>
            <div className="form-section">
              <label className="block text-sm font-medium mb-1">Název balíčku:</label>
              <textarea
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded resize-none overflow-hidden"
                style={{
                  minHeight: '2.5rem',
                  height: 'auto'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                rows={1}
              />
            </div>

            <div className="form-section">
              <label className="block text-sm font-medium mb-1">Cena balíčku (Kč):</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Výběr služeb pro balíček */}
            <div className="form-section">
              <label className="block text-sm font-medium mb-1">Vyberte služby v balíčku:</label>
              {Object.values(serviceGroups).map((categoryGroup) => (
                categoryGroup && categoryGroup.items && (
                  <div key={categoryGroup.id} className="mt-2">
                    <h3 className="font-medium">{categoryGroup.name}</h3>
                    {categoryGroup.items.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2 ml-4">
                        <input
                          type="checkbox"
                          checked={formData.selectedServices.has(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="rounded"
                        />
                        <span>{service.name}</span>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          </>
        )}

        {/* Tlačítka pro uložení/zrušení */}
        <div className="modal-actions flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button onClick={handleSave}>Uložit</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddServiceModal;