import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { getRecordsFromFirebase, deleteRecordFromFirebase } from './Firebase';

const SavedRecordsModal = ({ onClose, onLoadRecord }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      const fetchedRecords = await getRecordsFromFirebase();
      // Normalize the selectedPackages data structure
      const normalizedRecords = fetchedRecords.map(record => ({
        ...record,
        selectedPackages: record.selectedPackages || {},
      }));
      setRecords(normalizedRecords);
      setLoading(false);
    };
    loadRecords();
  }, []);

  const deleteRecord = async (recordId) => {
    const success = await deleteRecordFromFirebase(recordId);
    if (success) {
      setRecords(records.filter(record => record.id !== recordId));
    } else {
      alert('Při mazání záznamu došlo k chybě');
    }
  };

  const handleLoadRecord = (record) => {
    // Ensure the selectedPackages structure is correct
    const normalizedRecord = {
      ...record,
      selectedPackages: record.selectedPackages || {},
      selectedServices: new Set(record.selectedServices || [])
    };
    onLoadRecord(normalizedRecord);
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
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Načíst
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
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