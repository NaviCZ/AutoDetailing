// AddServiceModal.js
// Komponenta pro přidání nové služby do systému
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Clock, X, ChevronRight, ChevronDown } from 'lucide-react'; // Přidány nové ikony
import { createUpdateNotification } from '../utils/notifications';

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
    hourly: false,
  });

  // Stav pro rozbalené kategorie a podkategorie
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});

  // Načtení podkategorií pro vybranou kategorii
  const [subcategories, setSubcategories] = useState([]);

  // Aktualizace podkategorií při změně hlavní kategorie
  useEffect(() => {
    if (formData.mainCategory !== 'package') {
      const categoryData = serviceGroups[formData.mainCategory];
      if (categoryData && categoryData.items) {
        const uniqueSubcategories = [
          ...new Set(categoryData.items.map((item) => item.subcategory).filter(Boolean)),
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    setFormData((prev) => ({
      ...prev,
      selectedServices: newSelected,
    }));
  };

  // Rozbalení/sbalení kategorie
  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Rozbalení/sbalení podkategorie
  const toggleSubcategory = (subcategoryId) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId],
    }));
  };

  // Validace a uložení služby
  const handleSave = async () => {
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
      services: formData.mainCategory === 'package' ? Array.from(formData.selectedServices) : [],
    };

    await onSave(formData.mainCategory, newService);

    // Přidání notifikace o nové službě
    await createUpdateNotification(
      `Přidána nová ${newService.isPackage ? 'balíček' : 'služba'}: ${newService.name}`,
      {
        type: 'new',
        details: {
          typ: newService.isPackage ? 'balíček' : 'služba',
          název: newService.name,
          cena: `${newService.price} Kč`,
          kategorie: newService.mainCategory === 'interior' ? 'Interiér' : 'Exteriér',
        },
      }
    );

    onClose();
  };

  // Upravená část pro zobrazení kategorií v balíčku
  const renderServiceSelection = () => {
    return (
      <div className="form-section">
        <label className="block text-sm font-medium mb-3">Vyberte služby v balíčku:</label>
        <div className="space-y-2">
          {/* Sekce Interiér */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center bg-gray-50 p-3 cursor-pointer"
              onClick={() => toggleCategory('interior')}
            >
              {expandedCategories['interior'] ? (
                <ChevronDown className="h-5 w-5 text-gray-600 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600 mr-2" />
              )}
              <h3 className="font-medium text-gray-800">Interiér</h3>
            </div>
            
            {expandedCategories['interior'] && serviceGroups.interior && (
              <div className="p-3">
                {Object.entries(
                  serviceGroups.interior.items.reduce((acc, service) => {
                    const subcategory = service.subcategory || 'Ostatní';
                    if (!acc[subcategory]) acc[subcategory] = [];
                    acc[subcategory].push(service);
                    return acc;
                  }, {})
                ).map(([subcategory, services]) => (
                  <div key={subcategory} className="ml-4 mb-3">
                    <div
                      className="flex items-center py-2 cursor-pointer"
                      onClick={() => toggleSubcategory(subcategory)}
                    >
                      {expandedSubcategories[subcategory] ? (
                        <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <h4 className="font-medium text-sm text-gray-700">{subcategory}</h4>
                    </div>
                    
                    {expandedSubcategories[subcategory] && (
                      <div className="ml-6 space-y-2">
                        {services.map((service) => (
                          <label key={service.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.selectedServices.has(service.id)}
                              onChange={() => handleServiceToggle(service.id)}
                              className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{service.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sekce Exteriér */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center bg-gray-50 p-3 cursor-pointer"
              onClick={() => toggleCategory('exterior')}
            >
              {expandedCategories['exterior'] ? (
                <ChevronDown className="h-5 w-5 text-gray-600 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600 mr-2" />
              )}
              <h3 className="font-medium text-gray-800">Exteriér</h3>
            </div>
            
            {expandedCategories['exterior'] && serviceGroups.exterior && (
              <div className="p-3">
                {Object.entries(
                  serviceGroups.exterior.items.reduce((acc, service) => {
                    const subcategory = service.subcategory || 'Ostatní';
                    if (!acc[subcategory]) acc[subcategory] = [];
                    acc[subcategory].push(service);
                    return acc;
                  }, {})
                ).map(([subcategory, services]) => (
                  <div key={subcategory} className="ml-4 mb-3">
                    <div
                      className="flex items-center py-2 cursor-pointer"
                      onClick={() => toggleSubcategory(subcategory)}
                    >
                      {expandedSubcategories[subcategory] ? (
                        <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <h4 className="font-medium text-sm text-gray-700">{subcategory}</h4>
                    </div>
                    
                    {expandedSubcategories[subcategory] && (
                      <div className="ml-6 space-y-2">
                        {services.map((service) => (
                          <label key={service.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.selectedServices.has(service.id)}
                              onChange={() => handleServiceToggle(service.id)}
                              className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{service.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      {/* Tlačítko X pro zavření v pravém horním rohu */}
      <div className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
        <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
      </div>

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
                  height: 'auto',
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
                  height: 'auto',
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

            {/* Nové renderování výběru služeb */}
            {renderServiceSelection()}
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