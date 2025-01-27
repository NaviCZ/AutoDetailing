import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Checkbox } from './ui/Checkbox';
import { ClipboardList, AlertTriangle, ShoppingBag } from 'lucide-react';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';

const ToDoList = ({ selectedServices }) => {
  // Základní stavy komponenty
  const [tasks, setTasks] = useState({}); // Stav pro úkoly
  const [completedTasks, setCompletedTasks] = useState(new Set()); // Stav pro dokončené úkoly
  const [loading, setLoading] = useState(true); // Stav pro načítání
  const [products, setProducts] = useState({}); // Stav pro produkty

  // Definice kategorií úkolů
  const taskCategories = {
    interior: "Interiér",
    exterior: "Exteriér"
  };

  // Načtení úkolů z Firebase
  useEffect(() => {
    if (selectedServices.size === 0) {
      setTasks({});
      setLoading(false);
      return;
    }
  
    const database = getDatabase();
    
    const loadTasks = async () => {
      const tasksData = {};
      
      // Načtení úkolů pro každou vybranou službu
      for (const serviceId of selectedServices) {
        const serviceRef = ref(database, `services/interior/items/${serviceId}`);
        const snapshot = await get(serviceRef);
        
        // Pokud služba není v interiéru, zkusíme exteriér
        if (!snapshot.exists()) {
          const exteriorRef = ref(database, `services/exterior/items/${serviceId}`);
          const exteriorSnapshot = await get(exteriorRef);
          if (exteriorSnapshot.exists() && exteriorSnapshot.val().tasks) {
            tasksData[serviceId] = {
              id: serviceId,
              name: exteriorSnapshot.val().name,
              tasks: exteriorSnapshot.val().tasks,
              category: 'exterior' // Přidáme kategorii pro rozlišení
            };
          }
        } else if (snapshot.val().tasks) {
          tasksData[serviceId] = {
            id: serviceId,
            name: snapshot.val().name,
            tasks: snapshot.val().tasks,
            category: 'interior' // Přidáme kategorii pro rozlišení
          };
        }
      }
      
      setTasks(tasksData);
      setLoading(false);
    };
  
    loadTasks();
  }, [selectedServices]);

  // Načtení produktů z Firebase
  useEffect(() => {
    const database = getDatabase();
    const productsRef = ref(database, 'products');
    
    return onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        setProducts(snapshot.val());
      }
    });
  }, []);

  // Funkce pro rozdělení úkolů do kategorií
  const categorizedTasks = () => {
    const result = {
      interior: [],
      exterior: []
    };

    // Rozdělení úkolů podle kategorií
    Object.entries(tasks).forEach(([serviceId, serviceData]) => {
      const category = serviceData.category || 'interior';
      result[category].push({
        ...serviceData,
        serviceId
      });
    });

    return result;
  };

  // Výpočet celkového postupu
  const calculateProgress = () => {
    const totalTasks = Object.values(tasks).reduce((sum, serviceTasks) => 
      sum + serviceTasks.tasks.length, 0);
    const completedCount = completedTasks.size;
    
    return {
      percentage: totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0,
      completed: completedCount,
      total: totalTasks
    };
  };

  // Obsluha přepnutí stavu úkolu
  const handleTaskToggle = (serviceId, taskId) => {
    const taskKey = `${serviceId}-${taskId}`;
    setCompletedTasks(prev => {
      const newCompleted = new Set(prev);
      if (newCompleted.has(taskKey)) {
        newCompleted.delete(taskKey);
      } else {
        newCompleted.add(taskKey);
      }
      return newCompleted;
    });
  };

  // Obsluha kliknutí na řádek
  const handleRowClick = (serviceId, taskId, event) => {
    // Zabrání propagaci události pro interaktivní prvky
    if (event.target.tagName.toLowerCase() === 'a' || 
        event.target.tagName.toLowerCase() === 'button') {
      return;
    }
    handleTaskToggle(serviceId, taskId);
  };

  // Zobrazení načítání
  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-center">Načítání úkolů...</div>
        </CardContent>
      </Card>
    );
  }

  // Zobrazení prázdného stavu
  if (selectedServices.size === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <ClipboardList className="w-12 h-12 mb-2" />
            <div>Nejsou vybrány žádné služby</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rozdělení úkolů do kategorií
  const categorized = categorizedTasks();

  // Hlavní render komponenty
  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-orange-600 h-full rounded-full transition-all duration-300 relative"
                style={{ width: `${calculateProgress().percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-sm text-gray-600 text-center">
              Dokončeno {calculateProgress().completed} z {calculateProgress().total} úkolů
              ({Math.round(calculateProgress().percentage)}%)
            </div>
          </div>
          
          {/* Seznam úkolů podle kategorií */}
          {Object.entries(taskCategories).map(([categoryKey, categoryName]) => {
            // Přeskočíme kategorie bez úkolů
            if (categorized[categoryKey].length === 0) {
              return null;
            }

            return (
              <div key={categoryKey} className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">{categoryName}</h3>
                
                {categorized[categoryKey].map((serviceData) => (
                  <div key={serviceData.serviceId} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600 ml-2">
                      {serviceData.name}
                    </h4>
                    
                    <div className="space-y-2">
                      {serviceData.tasks.map((task, index) => {
                        const taskKey = `${serviceData.serviceId}-${index}`;
                        const isCompleted = completedTasks.has(taskKey);
                        const product = task.productId ? products[task.productId] : null;

                        return (
                          <div 
                            key={taskKey} 
                            onClick={(e) => handleRowClick(serviceData.serviceId, index, e)}
                            className={`
                              flex items-start space-x-3 p-3 rounded-lg border
                              ${isCompleted ? 'bg-gray-50' : 'bg-white'}
                              hover:bg-blue-50 cursor-pointer transition-all duration-200
                              transform hover:scale-[1.01] active:scale-[0.99]
                            `}
                          >
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleTaskToggle(serviceData.serviceId, index)}
                              className="mt-0.5 pointer-events-none"
                            />
                            <div className="flex-grow">
                              <div className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : ''}`}>
                                {task.description}
                              </div>
                              
                              {task.warning && !isCompleted && (
                                <div className="flex items-center text-amber-600 text-xs mt-2">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  {task.warning}
                                </div>
                              )}

                              {product && (
                                <div className="flex items-center space-x-2">
                                  <div className="text-blue-600 text-xs mt-2">
                                    <ShoppingBag className="inline-block w-4 h-4 mr-1" />
                                    Doporučený produkt: {product.name}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = '/products';
                                    }}
                                    className="text-gray-400 hover:text-gray-600 mt-2"
                                    title="Zobrazit produkty"
                                  >
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      className="w-4 h-4" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10"/>
                                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                      <line x1="12" y1="17" x2="12" y2="17"/>
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ToDoList;