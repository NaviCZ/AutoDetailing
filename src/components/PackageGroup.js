import React, { useState, useEffect } from 'react';
import { Edit2, ChevronDown, ChevronUp, MoreVertical, Check, HelpCircle } from 'lucide-react';
import { getDatabase, ref, onValue, update } from 'firebase/database';

const PackageGroup = ({ 
  packages,
  selectedPackages,
  onTogglePackage,
  onEditPackage,
  findServiceById
}) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [packageOrder, setPackageOrder] = useState({});
  const [movedPackage, setMovedPackage] = useState(null);
  const [expandedPackage, setExpandedPackage] = useState(null);

  // Načtení pořadí balíčků z Firebase
  useEffect(() => {
    const database = getDatabase();
    const orderRef = ref(database, 'settings/packageOrder');

    const unsubscribe = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        setPackageOrder(snapshot.val());
      } else {
        // Vytvoření výchozího pořadí
        const initialOrder = {};
        Object.keys(packages).forEach((packageName, index) => {
          initialOrder[packageName] = index;
        });
        setPackageOrder(initialOrder);
        update(orderRef, initialOrder);
      }
    });

    return () => unsubscribe();
  }, [packages]);

  // Funkce pro přesun balíčku
  const movePackage = async (packageName, direction) => {
    const currentOrder = { ...packageOrder };
    const entries = Object.entries(currentOrder)
      .sort(([, a], [b]) => a - b);

    const currentIndex = entries.findIndex(([name]) => name === packageName);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= entries.length) return;

    const newOrder = {};
    entries.forEach(([name, order], index) => {
      if (index === currentIndex) {
        return;
      }
      if (index === newIndex) {
        newOrder[packageName] = index;
        newOrder[entries[index][0]] = direction === 'up' ? index + 1 : index - 1;
      } else {
        newOrder[name] = index;
      }
    });

    try {
      setMovedPackage(packageName);
      setTimeout(() => setMovedPackage(null), 800);

      const db = getDatabase();
      await update(ref(db, 'settings/packageOrder'), newOrder);
    } catch (error) {
      console.error('Chyba při aktualizaci pořadí balíčků:', error);
    }
  };

  // Funkce pro řazení balíčků
  const getSortedPackages = () => {
    return Object.entries(packages)
      .sort(([nameA], [nameB]) => {
        const orderA = packageOrder[nameA] ?? Number.MAX_SAFE_INTEGER;
        const orderB = packageOrder[nameB] ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  };

  return (
    <div className="space-y-4">
      {/* Hlavička s tlačítkem pro řazení */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Balíčky služeb</h3>
        <button
          onClick={() => setIsReorderMode(!isReorderMode)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title={isReorderMode ? "Ukončit řazení" : "Seřadit balíčky"}
        >
          {isReorderMode ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <MoreVertical className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Seznam balíčků */}
      <div className="space-y-2">
        {getSortedPackages().map(([packageName, packageDetails], index) => (
          <div 
            key={packageName}
            className={`
              border rounded-lg transition-all duration-300 ease-in-out
              ${movedPackage === packageName 
                ? 'bg-blue-50 border-blue-400 shadow-md transform scale-[1.02] z-10' 
                : 'hover:border-blue-200'}
              ${selectedPackages[packageName] ? 'bg-blue-50' : ''}
            `}
          >
            {/* Hlavička balíčku */}
            <div 
  className={`
    flex items-center justify-between p-3 relative
    transition-colors duration-300 group
    ${movedPackage === packageName ? 'bg-blue-50' : ''}
  `}
            >
              <div 
                className="flex items-center flex-1 group"
                onClick={() => !isReorderMode && onTogglePackage(packageName)}
              >
                <input
                  type="checkbox"
                  checked={!!selectedPackages[packageName]}
                  onChange={(e) => {
                    e.stopPropagation();
                    onTogglePackage(packageName);
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="ml-2">{packageName}</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="font-medium whitespace-nowrap w-24 text-right">
                  {packageDetails.price?.toLocaleString()} Kč
                </span>

                {/* Tlačítka pro řazení nebo běžné ovládací prvky */}
                {isReorderMode ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => movePackage(packageName, 'up')}
                      className={`
                        p-1.5 rounded transition-colors duration-200
                        ${index === 0 
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:text-blue-700'}
                      `}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => movePackage(packageName, 'down')}
                      className={`
                        p-1.5 rounded transition-colors duration-200
                        ${index === Object.keys(packages).length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:text-blue-700'}
                      `}
                      disabled={index === Object.keys(packages).length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
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
      onEditPackage(packageName, packageDetails);
    }}
    className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <Edit2 size={16} className="text-gray-600" />
  </button>

                  </>
                )}
              </div>
            </div>

            {/* Detail balíčku */}
            {!isReorderMode && expandedPackage === packageName && (
              <div className="border-t p-3 bg-gray-50">
                <ul className="space-y-1">
                  {packageDetails.services?.map(serviceId => {
                    const service = findServiceById(serviceId);
                    if (!service) return null;
                    return (
                      <li key={serviceId} className="flex justify-between items-center">
                        <span>• {service.name}</span>
                        <span className="text-gray-600 w-24 text-right">
                          {service.price?.toLocaleString()} Kč
                        </span>
                      </li>
                    );
                  })}
                </ul>
                
                {/* Výpočet a zobrazení cenového rozdílu */}
                {(() => {
                  const totalValue = packageDetails.services?.reduce((sum, serviceId) => {
                    const service = findServiceById(serviceId);
                    return sum + (service?.price || 0);
                  }, 0);

                  const discountPercentage = totalValue > 0 
                    ? Math.round(((totalValue - packageDetails.price) / totalValue) * 100)
                    : 0;
                  
                  if (totalValue !== packageDetails.price) {
                    return (
                      <div className="mt-3 pt-2 border-t">
                        <div className="flex justify-between items-center text-blue-600 font-medium">
                          <span>Celková hodnota služeb:</span>
                          <span className="w-24 text-right">
                            {totalValue?.toLocaleString()} Kč
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-green-600 font-medium">
                          <span>Cena balíčku se slevou {discountPercentage}%:</span>
                          <span className="w-24 text-right">
                            {packageDetails.price?.toLocaleString()} Kč
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageGroup;