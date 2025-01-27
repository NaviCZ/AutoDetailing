// SavedRecordsModal.js
import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { getRecordsFromFirebase, deleteRecordFromFirebase } from './Firebase';
import { getDatabase, ref, onValue } from 'firebase/database';

const SavedRecordsModal = ({ onClose, onLoadRecord }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const database = getDatabase();
    const recordsRef = ref(database, 'records');

    const unsubscribe = onValue(recordsRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedRecords = [];
        snapshot.forEach((childSnapshot) => {
          const record = {
            id: childSnapshot.key,
            ...childSnapshot.val(),
            selectedPackages: childSnapshot.val().selectedPackages || {},
          };
          fetchedRecords.push(record);
        });
        setRecords(fetchedRecords);
      } else {
        setRecords([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteRecord = async (recordId) => {
    if (window.confirm('Opravdu chcete smazat tento záznam?')) {
      try {
        console.log('Mažu záznam s ID:', recordId);
        const success = await deleteRecordFromFirebase(recordId);
        
        if (!success) {
          console.error('Nepodařilo se smazat záznam');
          alert('Při mazání záznamu došlo k chybě');
        }
      } catch (error) {
        console.error('Chyba při mazání záznamu:', error);
        alert('Při mazání záznamu došlo k chybě');
      }
    }
  };

  const handleLoadRecord = (record) => {
    const normalizedRecord = {
      ...record,
      selectedPackages: record.selectedPackages || {},
      selectedServices: new Set(record.selectedServices || [])
    };
    onLoadRecord(normalizedRecord);
    onClose(); // Přidáno zavření modalu po načtení záznamu
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">
          <p>Načítání záznamů...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-4xl w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <List className="mr-2" /> Uložené záznamy
        </h2>

        {records.length === 0 ? (
          <p className="text-center text-gray-500">Žádné uložené záznamy</p>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="border rounded p-4 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{record.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(record.timestamp).toLocaleString()}
                  </p>
                  <p className="text-blue-600 font-bold">
                    {Math.round(record.finalPrice).toLocaleString()} Kč
                  </p>
                  {record.vehicleNotes && (
                    <p className="text-gray-700">{record.vehicleNotes}</p>
                  )}
                  <p className="text-gray-700">Uložil: {record.userEmail}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLoadRecord(record)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Načíst
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Zavřít
        </button>
      </div>
    </div>
  );
};

export default SavedRecordsModal;