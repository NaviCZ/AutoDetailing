import React, { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { Plus, Trash2 } from 'lucide-react';

const EditVariantsModal = ({ isOpen, onClose, service, onSave }) => {
    const [variants, setVariants] = useState(service.variants || []);
  
    const handleSubmit = (e) => {
        e.preventDefault();
      
        if (variants.some(v => !v.name || !v.price)) {
          alert('Všechny varianty musí mít vyplněný název a cenu');
          return;
        }
      
        const finalService = {
          ...service,
          variants: [],  // Nejdřív vyčistíme varianty
          hasVariants: false  // A nastavíme hasVariants na false
        };
      
        // Pouze pokud máme varianty, tak je přidáme
        if (variants.length > 0) {
          finalService.variants = variants;
          finalService.hasVariants = true;
        }
      
        console.log('EditVariantsModal - Finální data před uložením:', finalService);
        onSave(finalService);
        onClose();
      };
      
      const removeVariant = (index) => {
        const newVariants = variants.filter((_, i) => i !== index);
        setVariants(newVariants);
      
        // Pokud jsme smazali poslední variantu, okamžitě uložíme
        if (newVariants.length === 0) {
          const finalService = {
            ...service,
            variants: [],
            hasVariants: false
          };
          console.log('EditVariantsModal - Mazání poslední varianty:', finalService);
          onSave(finalService);
          onClose();
        }
      };
    
      const addVariant = () => {
        setVariants([...variants, { id: `variant-${Date.now()}`, name: '', price: '' }]);
      };
    
      const updateVariant = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index] = {
          ...newVariants[index],
          [field]: field === 'price' ? Number(value) : value
        };
        setVariants(newVariants);
      };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Upravit varianty služby {service.name}</h2>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={variant.id} className="flex items-center space-x-2">
              <input
                type="text"
                value={variant.name}
                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                placeholder="Název varianty"
                className="flex-grow p-2 border rounded"
              />
              <input
                type="number"
                value={variant.price}
                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                placeholder="Cena"
                className="w-32 p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <Button
            type="button"
            onClick={addVariant}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Přidat variantu
          </Button>
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

export default EditVariantsModal;