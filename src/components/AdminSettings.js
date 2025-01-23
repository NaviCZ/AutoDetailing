import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useServiceContext } from './ServiceContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import CategoryOrder from './admin/CategoryOrder';

const AdminSettings = () => {
  const { settings, updateSettings, serviceGroups } = useServiceContext();
  const [carSizeMarkup, setCarSizeMarkup] = useState(30);
  const [priceListYear, setPriceListYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState({});
  const [subcategoryOrder, setSubcategoryOrder] = useState({});

  // Načtení existujících nastavení
  useEffect(() => {
    if (settings) {
      setCarSizeMarkup(settings.carSizeMarkup * 100 || 30);
      setPriceListYear(settings.priceListYear || new Date().getFullYear());
      setCategoryOrder(settings.ordering?.categories || {});
      setSubcategoryOrder(settings.ordering?.subcategories || {});
    }
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings({
        carSizeMarkup: carSizeMarkup / 100,
        priceListYear: priceListYear,
        ordering: {
          categories: categoryOrder,
          subcategories: subcategoryOrder
        }
      });
      alert('Nastavení bylo úspěšně uloženo');
    } catch (error) {
      alert('Při ukládání nastavení došlo k chybě');
      console.error('Chyba při ukládání nastavení:', error);
    }
    setIsLoading(false);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(Object.entries(categoryOrder));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = {};
    items.forEach(([category], index) => {
      newOrder[category] = index + 1;
    });

    setCategoryOrder(newOrder);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Administrace</h1>
      
      {/* Obecná nastavení */}
      <Card className="mb-8">
        <CardContent className="space-y-6">
          <h2 className="text-xl font-semibold">Obecná nastavení</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Příplatek za velikost vozu (XL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={carSizeMarkup}
                onChange={(e) => setCarSizeMarkup(Number(e.target.value))}
                className="w-24 p-2 border rounded"
                min="0"
                max="100"
              />
              <span>%</span>
            </div>
          </div>
   
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rok ceníku
            </label>
            <input
              type="number"
              value={priceListYear}
              onChange={(e) => setPriceListYear(Number(e.target.value))}
              className="w-32 p-2 border rounded"
              min="2000"
              max="2100"
            />
          </div>
   
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto mt-4"
          >
            {isLoading ? 'Ukládání...' : 'Uložit obecná nastavení'}
          </Button>
        </CardContent>
      </Card>
   
      {/* Správa pořadí */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-6">Správa pořadí kategorií a služeb</h2>
          <CategoryOrder />
        </CardContent>
      </Card>
    </div>
   );
};

export default AdminSettings;