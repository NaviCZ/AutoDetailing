import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

const OrderingContext = createContext();

export const OrderingProvider = ({ children }) => {
  const [ordering, setOrdering] = useState({
    categories: {},
    subcategories: {}
  });

  useEffect(() => {
    const database = getDatabase();
    const orderingRef = ref(database, 'settings/ordering');

    const unsubscribe = onValue(orderingRef, (snapshot) => {
      if (snapshot.exists()) {
        setOrdering(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const getOrderedCategories = (categories) => {
    return Object.entries(categories)
      .sort(([categoryA, ], [categoryB, ]) => {
        const orderA = ordering.categories[categoryA] || 999;
        const orderB = ordering.categories[categoryB] || 999;
        return orderA - orderB;
      })
      .map(([category]) => category);
  };

  const getOrderedSubcategories = (category, subcategories) => {
    return [...subcategories].sort((a, b) => {
      const orderA = ordering.subcategories[category]?.[a] || 999;
      const orderB = ordering.subcategories[category]?.[b] || 999;
      return orderA - orderB;
    });
  };

  return (
    <OrderingContext.Provider value={{
      ordering,
      getOrderedCategories,
      getOrderedSubcategories
    }}>
      {children}
    </OrderingContext.Provider>
  );
};

export const useOrdering = () => {
  const context = useContext(OrderingContext);
  if (!context) {
    throw new Error('useOrdering must be used within an OrderingProvider');
  }
  return context;
};