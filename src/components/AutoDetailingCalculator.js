import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Printer, Download, Calculator, List, Package, Plus, Edit2, Trash2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { saveRecordToFirebase, getRecordsFromFirebase, deleteRecordFromFirebase, onAuthStateChangedListener } from './Firebase';
import { auth } from './Firebase';
import { useServiceContext } from './ServiceContext';
import { saveRecordToFirestore } from './Firebase';
import ServiceItem from './ServiceItem';
import ServiceGroup from './ServiceGroup';
import EditServiceModal from './EditServiceModal';
import PDFGenerator from './PDFGenerator';
import GitHubUpdates from './GitHubUpdates';
import SavedRecordsModal from './SavedRecordsModal';
import AddServiceModal from './AddServiceModal';
import EditPackageModal from './EditPackageModal';


const CAR_SIZE_MARKUP = 0.3; // 30% příplatek pro XL vozy

const AutoDetailingCalculator = () => {
  const { serviceGroups = {}, packages = {}, addService, updateService, deleteService } = useServiceContext();
  const [carSize, setCarSize] = useState('M');
  const [discount, setDiscount] = useState(15);
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [serviceVariants, setServiceVariants] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNotes, setVehicleNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [serviceHours, setServiceHours] = useState({});
  const [additionalCharges, setAdditionalCharges] = useState([{ description: '', amount: 0 }]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedPackages, setSelectedPackages] = useState({});
  const [showPriceList, setShowPriceList] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [showSavedRecords, setShowSavedRecords] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [expandedPackage, setExpandedPackage] = useState(null);
  const [activePackageId, setActivePackageId] = useState(null);

  const interiorGroups = serviceGroups?.interior || {};
  const exteriorGroups = serviceGroups?.exterior || {};

  const [selectedVariants, setSelectedVariants] = useState({});
  const [error, setError] = useState(null);

  const handleAddService = () => {
    setIsAddModalOpen(true);
  };

  const handleEditPackage = (packageName, packageDetails) => {
    setEditingPackage({ ...packageDetails, name: packageName });
  };
  
  const handleDeletePackage = async (packageId) => {
    if (window.confirm('Opravdu chcete smazat tento balíček?')) {
      try {
        await deleteService('package', packageId);
      } catch (error) {
        console.error('Chyba při mazání balíčku:', error);
      }
    }
  };

  const handleEditService = async (category, updatedService) => {
    console.log('AutoDetailingCalculator - editace služby před zpracováním:', 
      { category, updatedService }
    );
  
    if (!category || !updatedService) {
      console.error('Chybí data pro editaci:', { category, updatedService });
      return;
    }
  
    // Přidáme nastavení editingService pro otevření modalu
    setEditingService({
      ...updatedService,
      mainCategory: category
    });
  };

  const handleEditServiceSave = (groupId, updatedService) => {
    if (!groupId || !updatedService) {
      console.error('Chybí data pro uložení:', { groupId, updatedService });
      return;
    }
    updateService(groupId, {
      ...updatedService,
      mainCategory: groupId
    });
    setEditingService(null);
  };
  

  const handleDeleteService = (serviceGroupId, serviceId) => {
    if (window.confirm('Opravdu chcete smazat tuto službu?')) {
      deleteService(serviceGroupId, serviceId);
    }
  };
  
  

  const handleVariantChange = (groupId, value) => {
    const newSelected = new Set(selectedServices);
    if (serviceVariants[groupId]) {
      newSelected.delete(serviceVariants[groupId]);
    }

    if (value) {
      newSelected.add(value);
      setServiceVariants({ ...serviceVariants, [groupId]: value });
    } else {
      const newVariants = { ...serviceVariants };
      delete newVariants[groupId];
      setServiceVariants(newVariants);
    }

    setSelectedServices(newSelected);
  };

  
  const toggleService = (id) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (serviceHours[id]) {
        const newServiceHours = { ...serviceHours };
        delete newServiceHours[id];
        setServiceHours(newServiceHours);
      }
    } else {
      newSelected.add(id);
      const service =
        [...Object.values(interiorGroups).flatMap(group => group.services || group.options || []),
         ...Object.values(exteriorGroups).flatMap(group => group.services || group.options || [])]
          .find(service => service.id === id);

      if (service?.hourly) {
        setServiceHours({ ...serviceHours, [id]: 1 });
      }
    }
    setSelectedServices(newSelected);
  };

  const togglePackage = (packageName) => {
    const newSelectedPackages = { ...selectedPackages };
    
    if (newSelectedPackages[packageName]) {
      // Při odznačení balíčku
      delete newSelectedPackages[packageName];
      // ODSTRANĚNO: nebudeme automaticky odznačovat jednotlivé služby
    } else {
      // Při označení balíčku
      newSelectedPackages[packageName] = {
        services: packages[packageName]?.services || [],
        price: packages[packageName]?.price || 0
      };
      // ODSTRANĚNO: nebudeme automaticky označovat jednotlivé služby
    }
    
    setSelectedPackages(newSelectedPackages);
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setDiscount('');
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setDiscount(numValue);
      }
    }
  };
  
  const handleVariantSelect = (serviceId, variantId) => {
    if (variantId) {
      // Když je vybrána varianta, přidáme službu do selectedServices
      setSelectedServices(prev => new Set([...prev, serviceId]));
      setSelectedVariants(prev => ({
        ...prev,
        [serviceId]: variantId
      }));
    } else {
      // Když je výběr zrušen, odstraníme službu i variantu
      setSelectedServices(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(serviceId);
        return newSelected;
      });
      setSelectedVariants(prev => {
        const newVariants = { ...prev };
        delete newVariants[serviceId];
        return newVariants;
      });
    }
  };
  
  const handleToggleService = (id) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      // Odstranění variant a hodin při odznačení služby
      if (selectedVariants[id]) {
        const newVariants = { ...selectedVariants };
        delete newVariants[id];
        setSelectedVariants(newVariants);
      }
      if (serviceHours[id]) {
        const newHours = { ...serviceHours };
        delete newHours[id];
        setServiceHours(newHours);
      }
    } else {
      newSelected.add(id);
      // Přidání výchozích hodin pro hodinové služby
      const service = findServiceById(id);
      if (service?.hourly) {
        setServiceHours(prev => ({ ...prev, [id]: 1 }));
      }
    }
    setSelectedServices(newSelected);
  };
  
  const findServiceById = (serviceId) => {
    for (const category of Object.values(serviceGroups)) {
      if (category.items) {
        const service = category.items.find(item => item.id === serviceId);
        if (service) return service;
      }
    }
    return null;
  };
  
  const handleEditSubcategory = async (category, oldSubcategory, newSubcategory) => {
    if (!category || !oldSubcategory || !newSubcategory) return;
  
    try {
      // Aktualizujeme všechny služby v dané podkategorii
      const updatedServices = serviceGroups[category].items.map(service => {
        if (service.subcategory === oldSubcategory) {
          const updatedService = { 
            ...service, 
            subcategory: newSubcategory 
          };
          // Aktualizujeme každou službu jednotlivě pomocí existující metody
          updateService(category, updatedService);
          return updatedService;
        }
        return service;
      });
  
    } catch (error) {
      console.error('Chyba při aktualizaci podkategorie:', error);
      setError('Chyba při aktualizaci podkategorie: ' + error.message);
    }
  };
  const handleDeleteSubcategory = async (category, subcategory) => {
  if (window.confirm(`Opravdu chcete smazat podkategorii "${subcategory}" a všechny její služby?`)) {
    try {
      // Najdeme všechny služby v dané podkategorii
      const servicesToDelete = serviceGroups[category].items
        .filter(service => service.subcategory === subcategory);
      
      // Použijeme existující deleteService pro každou službu
      for (const service of servicesToDelete) {
        await deleteService(category, service.id);
      }
      
    } catch (error) {
      console.error('Chyba při mazání podkategorie:', error);
      setError('Chyba při mazání podkategorie: ' + error.message);
    }
  }
};
  const calculateServicePrice = (serviceId) => {
    const service = findServiceById(serviceId);
    if (!service) return 0;
  
    if (service.hasVariants && selectedVariants[serviceId]) {
      const variant = service.variants.find(v => v.id === selectedVariants[serviceId]);
      return variant ? variant.price : 0;
    }
  
    if (service.hourly) {
      return (service.price || 0) * (serviceHours[serviceId] || 1);
    }
  
    return service.price || 0;
  };
  
  const updatePrices = () => {
    let sum = 0;

    // Součet cen vybraných služeb včetně variant
    selectedServices.forEach(serviceId => {
      const service = findServiceById(serviceId);
      if (service) {
        if (service.hasVariants && selectedVariants[serviceId]) {
          const variant = service.variants.find(v => v.id === selectedVariants[serviceId]);
          if (variant) {
            sum += variant.price;
          }
        } else if (service.hourly) {
          sum += (service.price || 0) * (serviceHours[serviceId] || 1);
        } else {
          sum += service.price || 0;
        }
      }
    });
  
    // Přičtení cen balíčků
    Object.entries(selectedPackages).forEach(([packageName]) => {
      const packagePrice = packages[packageName]?.price || 0;
      sum += packagePrice;
    });
  
    // Aplikace příplatku pro XL vozy
    if (carSize === 'XL') {
      sum *= (1 + CAR_SIZE_MARKUP);
    }
  
    // Výpočet slevy
    const validDiscount = Number(discount) || 0;
    const discountAmt = (sum * validDiscount) / 100;
  
    // Přičtení dodatečných nákladů
    const additionalChargesSum = additionalCharges.reduce((acc, charge) => {
      return acc + (Number(charge.amount) || 0);
    }, 0);
  
    const final = sum - discountAmt + additionalChargesSum;
  
    setTotalPrice(sum);
    setDiscountAmount(discountAmt);
    setFinalPrice(final);
  };

  useEffect(() => {
    updatePrices();
  }, [selectedServices, selectedVariants, discount, carSize, serviceHours, additionalCharges, selectedPackages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      if (currentUser) {
        setUserEmail(currentUser.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderServiceGroup = (category, group) => (
    <ServiceGroup
  key={category}
  category={category}
  group={group}
  onToggleService={toggleService}
  onEditService={handleEditService}
  onDeleteService={handleDeleteService}
  selectedServices={selectedServices}
  selectedVariants={selectedVariants}
  onVariantSelect={handleVariantSelect}
  onEditGroup={handleEditGroup}
  onDeleteGroup={handleDeleteGroup}
  onEditSubcategory={handleEditSubcategory}
  onDeleteSubcategory={handleDeleteSubcategory}
  serviceHours={serviceHours}
  onHoursChange={(serviceId, hours) => {
    setServiceHours(prev => ({
      ...prev,
      [serviceId]: hours
    }));
  }}
/>
  );

  const handleEditGroup = (category, editedGroup) => {
    console.log('Editing group:', category, editedGroup);
  };
  
  const handleDeleteGroup = (category) => {
    if (window.confirm('Opravdu chcete smazat tuto kategorii?')) {
      console.log('Deleting group:', category);
    }
  };

  const handleAdditionalChargeChange = (index, field, value) => {
    const newCharges = [...additionalCharges];

    if (field === 'amount') {
      let numValue = '';
      if (value !== '' && value !== null && value !== undefined) {
        const stringValue = String(value);
        numValue = Number(stringValue.replace(/^0+/, '').replace(/[^0-9.]/g, ''));
        numValue = numValue > 0 ? numValue : '';
      }
      newCharges[index][field] = numValue;
    } else {
      newCharges[index][field] = value;
    }

    setAdditionalCharges(newCharges);
  };

  const addAdditionalCharge = () => {
    setAdditionalCharges([...additionalCharges, { description: '', amount: 0 }]);
  };

  const saveRecord = async () => {
    const recordToSave = {
      customerName,
      customerPhone,
      vehicleNotes,
      selectedServices: Array.from(selectedServices),
      serviceVariants,
      carSize,
      totalPrice,
      discount,
      finalPrice,
      additionalCharges,
      additionalNotes,
      selectedPackages: Object.fromEntries(
        Object.entries(selectedPackages).map(([name, data]) => [
          name,
          {
            services: packages[name]?.services || [],
            price: packages[name]?.price || 0
          }
        ])
      ),
      timestamp: new Date().toISOString(),
      userEmail: userEmail
    };
    
    const success = await saveRecordToFirebase(recordToSave);
    if (success) {
      alert('Záznam byl úspěšně uložen');
    } else {
      alert('Při ukládání záznamu došlo k chybě');
    }
  };

  const loadRecord = (record) => {
    setCustomerName(record.customerName);
    setCustomerPhone(record.customerPhone);
    setVehicleNotes(record.vehicleNotes);
    setSelectedServices(new Set(record.selectedServices));
    setServiceVariants(record.serviceVariants || {});
    setCarSize(record.carSize);
    setDiscount(record.discount);
    setAdditionalCharges(record.additionalCharges);
    setAdditionalNotes(record.additionalNotes);
    setSelectedPackages(record.selectedPackages || {});
    setUserEmail(record.userEmail);
    setShowSavedRecords(false);
  };

  
  return (
    <>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-between space-x-2 flex-wrap">
          <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
            <div className="bg-blue-600 text-white p-4 rounded-full">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MV Auto Detailing</h1>
              <p className="text-gray-500">Kalkulace služeb</p>
            </div>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={handleAddService}
              className="h-12 px-4 mb-2 sm:mb-0 w-full sm:w-auto flex-grow flex items-center justify-center"
            >
              <Plus size={16} /> Přidat službu
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowSavedRecords(true)}
              className="h-12 px-4 mb-2 sm:mb-0 w-full sm:w-auto flex-grow flex items-center justify-center"
            >
              <List className="mr-2" /> Uložené záznamy
            </Button>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <AddServiceModal
          onSave={(category, newService) => {
            addService(category, newService);
            setIsAddModalOpen(false);
          }}
          onClose={() => setIsAddModalOpen(false)}
          serviceGroups={serviceGroups}
        />
      )}

{editingService && (
  <EditServiceModal
    isOpen={!!editingService}
    service={editingService}
    onSave={(updatedService) => handleEditServiceSave(editingService.mainCategory, updatedService)}
    onClose={() => setEditingService(null)}
    onDelete={() => {
      if (editingService.mainCategory && editingService.id) {
        handleDeleteService(editingService.mainCategory, editingService.id);
        setEditingService(null);
      } else {
        console.error('Chybí data pro smazání služby:', editingService);
        alert('Nelze smazat službu - chybí potřebná data');
      }
    }}
  />
)}

{editingPackage && (
  <EditPackageModal
    isOpen={!!editingPackage}
    package={editingPackage}
    services={serviceGroups}
    onClose={() => setEditingPackage(null)}
    onSave={async (updatedPackage) => {
      await updateService('package', updatedPackage);
      setEditingPackage(null);
    }}
  />
)}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jméno zákazníka</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Jan Novák"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="+420 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Poznámky k vozidlu</label>
              <textarea
                value={vehicleNotes}
                onChange={(e) => setVehicleNotes(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Specifické poznámky nebo požadavky..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Velikost vozu</label>
                <select
                  value={carSize}
                  onChange={(e) => setCarSize(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="M">M - Střední vozy</option>
                  <option value="XL">XL - SUV/Dodávky</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {renderServiceGroup('interior', serviceGroups?.interior)}
              {renderServiceGroup('exterior', serviceGroups?.exterior)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
  <CardContent className="pt-6">
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Balíčky služeb</h3>
      {packages && Object.entries(packages).map(([packageName, packageDetails], index) => (
        <div 
          key={`${packageName}-${index}`} 
          className={`border rounded-lg ${selectedPackages[packageName] ? 'bg-blue-50' : ''}`}
        >
          <div 
            className="flex items-center justify-between hover:bg-gray-100 p-2 cursor-pointer group"
            onClick={() => togglePackage(packageName)}
          >
            <div className="flex items-center flex-1">
              <input
                type="checkbox"
                checked={!!selectedPackages[packageName]}
                onChange={(e) => {
                  e.stopPropagation();
                  togglePackage(packageName);
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="ml-2">{packageName}</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="font-medium whitespace-nowrap w-24 text-right">
                {packageDetails.price?.toLocaleString()} Kč
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedPackage(expandedPackage === packageName ? null : packageName);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Zobrazit obsah balíčku"
              >
                <HelpCircle size={16} className="text-gray-600" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPackage(packageName, packageDetails);
                }}
                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Detail balíčku */}
          {expandedPackage === packageName && (
            <div className="border-t p-3 bg-gray-50">
              <ul className="space-y-1">
                {packageDetails.services?.map(serviceId => {
                  const service = findServiceById(serviceId);
                  if (!service) return null;
                  return (
                    <li key={serviceId} className="flex justify-between items-center">
                      <span>• {service.name}</span>
                      <span className="text-gray-600 w-24 text-right">{service.price?.toLocaleString()} Kč</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 pt-2 border-t">
                <div className="flex justify-between items-center text-blue-600 font-medium">
                  <span>Celková hodnota služeb:</span>
                  <span className="w-24 text-right">
                    {packageDetails.services?.reduce((sum, serviceId) => {
                      const service = findServiceById(serviceId);
                      return sum + (service?.price || 0);
                    }, 0).toLocaleString()} Kč
                  </span>
                </div>
                <div className="flex justify-between items-center text-green-600 font-medium">
                  <span>Cena balíčku:</span>
                  <span className="w-24 text-right">{packageDetails.price?.toLocaleString()} Kč</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </CardContent>
</Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Dodatečné náklady</h3>
            {additionalCharges.map((charge, index) => (
              <div key={`charge-${index}`} className="flex items-center space-x-4">
                <input
                  type="text"
                  value={charge.description}
                  onChange={(e) => handleAdditionalChargeChange(index, 'description', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Popis dodatečného nákladu"
                />
                <input
                  type="number"
                  value={charge.amount}
                  onChange={(e) => handleAdditionalChargeChange(index, 'amount', Number(e.target.value))}
                  className="w-24 p-2 border rounded"
                  placeholder="Kč"
                />
              </div>
            ))}
            <button
              onClick={addAdditionalCharge}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Přidat další náklad
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Celkem bez slevy:</span>
              <span className="font-bold">{Math.round(totalPrice).toLocaleString()} Kč</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <div className="flex items-center gap-2">
                <span>Sleva:</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={handleDiscountChange}
                  className="w-16 p-1 border rounded"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
              <span>{discountAmount > 0 ? `-${Math.round(discountAmount).toLocaleString()} Kč` : ''}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-xl">
                <span className="font-bold">Konečná cena k zaplacení:</span>
                <span className="font-bold text-blue-600">
                  {finalPrice ? `${Math.round(finalPrice).toLocaleString()} Kč` : 'Není k dispozici'}
                </span>
              </div>

              {carSize === 'XL' && (
                <div className="text-sm text-gray-500 mt-2">
                  * Cena zahrnuje navýšení o 30% pro velikost vozu XL.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Poznámky:</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Poznámka která bude na faktuře..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between space-x-2 mt-4 mb-4 mx-4">
        <button
          onClick={saveRecord}
          className="bg-blue-500 text-white px-4 py-2 rounded flex-grow"
        >
          Uložit záznam
        </button>
        <PDFGenerator
          customerName={customerName}
          customerPhone={customerPhone}
          vehicleNotes={vehicleNotes}
          serviceGroups={serviceGroups}
          selectedServices={selectedServices}
          selectedVariants={selectedVariants}
          serviceHours={serviceHours}
          totalPrice={totalPrice}
          discount={discount}
          discountAmount={discountAmount}
          carSize={carSize}
          finalPrice={finalPrice}
          additionalCharges={additionalCharges}
          additionalNotes={additionalNotes}
          selectedPackages={selectedPackages}
          carSizeMarkup={CAR_SIZE_MARKUP}
          packages={packages}
        />
      </div>

      <GitHubUpdates repoOwner="NaviCZ" repoName="AutoDetailing" />

      {showSavedRecords && (
        <SavedRecordsModal
          records={JSON.parse(localStorage.getItem('autoDetailingRecords') || '[]')}
          onClose={() => setShowSavedRecords(false)}
          onLoadRecord={loadRecord}
        />
      )}
    </>
  );
};

export default AutoDetailingCalculator;