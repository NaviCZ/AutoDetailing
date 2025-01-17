import React, { useState } from 'react';
import { useServiceContext } from './ServiceContext';
import { Edit2, Trash2, Plus } from 'lucide-react';
import EditServiceModal from './ServiceItem';
import AddServiceModal from './AddServiceModal';
import EditServiceModal from './EditServiceModal';

const ServiceManagement = () => {
  const { serviceGroups, loading, error, addService, updateService, deleteService } =
    useServiceContext();
  const [editingService, setEditingService] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Otevření modalu pro přidání služby
  const handleAddService = () => {
    setIsAddModalOpen(true);
  };

  // Otevření modalu pro editaci služby
  const handleEditService = (service) => {
    setEditingService(service);
  };

  // Smazání služby
  const handleDeleteService = (serviceGroupId, serviceId) => {
    if (window.confirm('Opravdu chcete smazat tuto službu?')) {
      deleteService(serviceGroupId, serviceId);
    }
  };

  if (loading) return <div>Načítání služeb...</div>;
  if (error) return <div>Chyba: {error}</div>;

  return (
    <div className="service-management">
      <h2>Správa služeb</h2>
      
      {/* Tlačítko pro přidání služby */}
      <button onClick={handleAddService} className="add-service-button">
        <Plus size={16} /> Přidat službu
      </button>

      {/* Zobrazení skupin služeb */}
      {Object.entries(serviceGroups).map(([groupName, group]) => (
        <div key={groupName} className="service-group">
          <h3>{group.name}</h3>
          <ul>
            {group.services.map((service) => (
              <li key={service.id} className="service-item">
                <span>
                  {service.name} - {service.price} Kč
                </span>
                <div className="service-actions">
                  {/* Tlačítko pro editaci služby */}
                  <button onClick={() => handleEditService(service)}>
                    <Edit2 size={16} />
                  </button>
                  {/* Tlačítko pro smazání služby */}
                  <button onClick={() => handleDeleteService(groupName, service.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Modal pro editaci služby */}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onSave={(updatedService) => {
            updateService(editingService.groupId, updatedService);
            setEditingService(null);
          }}
          onClose={() => setEditingService(null)}
        />
      )}

      {/* Modal pro přidání služby */}
      {isAddModalOpen && (
        <AddServiceModal
          onSave={(newService) => {
            addService(newService.groupId, newService);
            setIsAddModalOpen(false);
          }}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ServiceManagement;