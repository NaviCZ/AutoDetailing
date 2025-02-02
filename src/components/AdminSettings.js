import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useServiceContext } from './ServiceContext';

const AdminSettings = () => {
  const { settings, updateSettings, restoreInteriorServices } = useServiceContext();
  const [carSizeMarkup, setCarSizeMarkup] = useState(30);
  const [priceListYear, setPriceListYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setCarSizeMarkup(settings.carSizeMarkup * 100 || 30);
      setPriceListYear(settings.priceListYear || new Date().getFullYear());
    }
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings({
        carSizeMarkup: carSizeMarkup / 100,
        priceListYear: priceListYear
      });
      alert('Nastavení bylo úspěšně uloženo');
    } catch (error) {
      alert('Při ukládání nastavení došlo k chybě');
      console.error('Chyba při ukládání nastavení:', error);
    }
    setIsLoading(false);
  };

  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Administrace</h1>
      
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
            {isLoading ? 'Ukládání...' : 'Uložit nastavení'}
          </Button>
        </CardContent>
      </Card>

      
    </div>
  );
};

export default AdminSettings;