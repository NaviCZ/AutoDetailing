import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '../ui/Button';

const CategoryOrderManager = () => {
  const [categoryOrder, setCategoryOrder] = useState({});
  const [subcategoryOrder, setSubcategoryOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrdering();
  }, []);

  const loadOrdering = async () => {
    try {
      const database = getDatabase();
      const orderingRef = ref(database, 'settings/ordering');
      const snapshot = await get(orderingRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setCategoryOrder(data.categories || {});
        setSubcategoryOrder(data.subcategories || {});
      } else {
        // Pokud pořadí neexistuje, inicializujeme ho
        await initializeOrdering();
      }
    } catch (err) {
      console.error('Chyba při načítání pořadí:', err);
      setError('Nepodařilo se načíst pořadí');
    } finally {
      setLoading(false);
    }
  };

  const initializeOrdering = async () => {
    const database = getDatabase();
    const servicesRef = ref(database, 'services');
    const snapshot = await get(servicesRef);

    if (snapshot.exists()) {
      const services = snapshot.val();
      const initialOrdering = {
        categories: {},
        subcategories: {}
      };

      // Inicializace pořadí kategorií
      Object.keys(services).forEach((category, index) => {
        initialOrdering.categories[category] = index + 1;
      });

      // Inicializace pořadí podkategorií
      Object.entries(services).forEach(([category, data]) => {
        initialOrdering.subcategories[category] = {};
        const subcategories = new Set();
        
        // Získání unikátních podkategorií
        Object.values(data.items || {}).forEach(service => {
          if (service.subcategory) {
            subcategories.add(service.subcategory);
          }
        });

        // Nastavení pořadí podkategorií
        Array.from(subcategories).forEach((subcategory, index) => {
          initialOrdering.subcategories[category][subcategory] = index + 1;
        });
      });

      // Uložení inicializovaného pořadí
      const orderingRef = ref(database, 'settings/ordering');
      await set(orderingRef, initialOrdering);

      setCategoryOrder(initialOrdering.categories);
      setSubcategoryOrder(initialOrdering.subcategories);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(Object.entries(categoryOrder));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = {};
    items.forEach(([category], index) => {
      newOrder[category] = index + 1;
    });

    setCategoryOrder(newOrder);
    
    // Uložit do Firebase
    const database = getDatabase();
    const orderingRef = ref(database, 'settings/ordering/categories');
    await set(orderingRef, newOrder);
  };

  if (loading) return <div>Načítání...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Správa pořadí kategorií a služeb</h1>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Kategorie</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {Object.entries(categoryOrder)
                    .sort(([,a], [,b]) => a - b)
                    .map(([category, order], index) => (
                      <Draggable key={category} draggableId={category} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-3 bg-gray-50 border rounded-lg cursor-move hover:bg-gray-100"
                          >
                            {category === 'interior' ? 'Interiér' : 
                             category === 'exterior' ? 'Exteriér' : 
                             category}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default CategoryOrderManager;