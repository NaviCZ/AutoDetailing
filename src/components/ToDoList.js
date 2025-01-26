import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Checkbox } from './ui/Checkbox';
import { ClipboardList, AlertTriangle, ShoppingBag } from 'lucide-react';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';

const ToDoList = ({ selectedServices }) => {
  const [tasks, setTasks] = useState({});
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState({});
  const navigate = useNavigate();
  // Načtení úkolů
  useEffect(() => {
    if (selectedServices.size === 0) {
      setTasks({});
      setLoading(false);
      return;
    }
  
    const database = getDatabase();
    
    const loadTasks = async () => {
      const tasksData = {};
      
      for (const serviceId of selectedServices) {
        const serviceRef = ref(database, `services/interior/items/${serviceId}`);
        const snapshot = await get(serviceRef);
        
        if (!snapshot.exists()) {
          const exteriorRef = ref(database, `services/exterior/items/${serviceId}`);
          const exteriorSnapshot = await get(exteriorRef);
          if (exteriorSnapshot.exists() && exteriorSnapshot.val().tasks) {
            tasksData[serviceId] = {
              id: serviceId,
              name: exteriorSnapshot.val().name,
              tasks: exteriorSnapshot.val().tasks
            };
          }
        } else if (snapshot.val().tasks) {
          tasksData[serviceId] = {
            id: serviceId,
            name: snapshot.val().name,
            tasks: snapshot.val().tasks
          };
        }
      }
      
      setTasks(tasksData);
      setLoading(false);
    };
  
    loadTasks();
  }, [selectedServices]);

  // Načtení produktů
  useEffect(() => {
    const database = getDatabase();
    const productsRef = ref(database, 'products');
    
    return onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        setProducts(snapshot.val());
      }
    });
  }, []);

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

  const handleRowClick = (serviceId, taskId, event) => {
    if (event.target.tagName.toLowerCase() === 'a' || 
        event.target.tagName.toLowerCase() === 'button') {
      return;
    }
    handleTaskToggle(serviceId, taskId);
  };

  const progress = (() => {
    const totalTasks = Object.values(tasks).reduce((sum, serviceTasks) => 
      sum + serviceTasks.tasks.length, 0);
    const completedCount = completedTasks.size;
    return totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  })();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-center">Načítání úkolů...</div>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
 <div 
   className="bg-orange-600 h-2.5 rounded-full transition-all duration-300" 
   style={{ width: `${progress}%` }}
 />
</div>
          
          {Object.entries(tasks).map(([serviceId, serviceTasks]) => (
            <div key={serviceId} className="space-y-2">
              <h3 className="font-medium">{serviceTasks.name}</h3>
              <div className="space-y-2">
                {serviceTasks.tasks.map((task, index) => {
                  const taskKey = `${serviceId}-${index}`;
                  const isCompleted = completedTasks.has(taskKey);
                  const product = task.productId ? products[task.productId] : null;

                  return (
                    <div 
                      key={taskKey} 
                      onClick={(e) => handleRowClick(serviceId, index, e)}
                      className={`
                        flex items-start space-x-3 p-3 rounded-lg border
                        ${isCompleted ? 'bg-gray-50' : 'bg-white'}
                        hover:bg-blue-50 cursor-pointer transition-all duration-200
                        transform hover:scale-[1.01] active:scale-[0.99]
                      `}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleTaskToggle(serviceId, index)}
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
  <div 
    className="flex items-center text-blue-600 text-xs mt-2 hover:text-blue-800 cursor-pointer"
    onClick={(e) => {
      e.stopPropagation(); 
      window.location.href = '/products';
    }}
  >
    <ShoppingBag className="w-4 h-4 mr-1" />
    Doporučený produkt: {product.name}
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
      </CardContent>
    </Card>
  );
};

export default ToDoList;