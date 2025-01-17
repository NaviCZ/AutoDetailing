import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Clock } from 'lucide-react';

const AddServiceModal = ({ onSave, onClose, serviceGroups = {} }) => {
  const [formData, setFormData] = useState({
    mainCategory: 'interior',
    subcategory: '',
    isNewSubcategory: false,
    newSubcategory: '',
    isPackage: false,
    selectedServices: new Set(),
    hasVariants: false,
    variants: [],
    name: '',
    price: '',
    hourly: false
  });

  const [subcategories, setSubcategories] = useState([]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: field === 'price' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      variants: newVariants
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: '' }]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

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

  const handleSave = () => {
    if (formData.hasVariants) {
      if (!formData.isNewSubcategory && !formData.subcategory) {
        alert('Vyberte nebo vytvořte podkategorii');
        return;
      }
      if (formData.isNewSubcategory && !formData.newSubcategory.trim()) {
        alert('Zadejte název nové podkategorie');
        return;
      }
      if (formData.variants.length === 0) {
        alert('Přidejte alespoň jednu variantu služby');
        return;
      }
      const invalidVariants = formData.variants.some(
        variant => !variant.name || !variant.price || isNaN(variant.price)
      );
      if (invalidVariants) {
        alert('Všechny varianty musí mít vyplněný název a platnou cenu');
        return;
      }
    } else {
      if (!formData.name.trim()) {
        alert('Název služby je povinný');
        return;
      }
      if (!formData.price || isNaN(formData.price)) {
        alert('Cena musí být platné číslo');
        return;
      }
    }

    const newService = {
      id: Date.now().toString(),
      mainCategory: formData.mainCategory,
      subcategory: formData.isNewSubcategory ? formData.newSubcategory : formData.subcategory || '',
      isPackage: formData.mainCategory === 'package',
      hasVariants: formData.hasVariants,
      ...(formData.hasVariants ? {
        name: formData.isNewSubcategory ? formData.newSubcategory : formData.subcategory,
        price: 0,
        variants: formData.variants.map((variant, index) => ({
          id: `variant-${Date.now()}-${index}`,
          name: variant.name,
          price: Number(variant.price)
        }))
      } : {
        name: formData.name,
        price: Number(formData.price),
        hourly: formData.hourly,
        variants: []
      }),
      services: formData.mainCategory === 'package' ? Array.from(formData.selectedServices) : []
    };

    onSave(formData.mainCategory, newService);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Přidat novou službu</h2>
      <div className="space-y-4">
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

        {formData.mainCategory !== 'package' && (
          <>
            <div className="form-section">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="hasVariants"
                  checked={formData.hasVariants}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm">Služba má varianty</span>
              </label>
            </div>

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

            {formData.hasVariants ? (
              <div className="space-y-4">
                <h4 className="font-medium">Varianty služby</h4>
                {formData.variants.map((variant, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                      placeholder="Název varianty"
                      className="flex-grow p-2 border rounded"
                    />
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      placeholder="Cena"
                      className="w-32 p-2 border rounded"
                    />
                    <button
                      onClick={() => removeVariant(index)}
                      className="p-2 text-red-500"
                    >
                      Odstranit
                    </button>
                  </div>
                ))}
                <button
                  onClick={addVariant}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Přidat variantu
                </button>
              </div>
            ) : (
              <>
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
          </>
        )}

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

        <div className="modal-actions flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button onClick={handleSave}>Uložit</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddServiceModal;