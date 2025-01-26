import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Plus } from 'lucide-react';
import { useServiceContext } from './ServiceContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { getProductsFromFirebase } from './Firebase';

const EditServiceModal = ({ isOpen, service, onClose, onSave, onDelete }) => {
 const { serviceGroups } = useServiceContext();
 const [editedService, setEditedService] = useState(null);
 const [subcategories, setSubcategories] = useState([]);
 const [tasks, setTasks] = useState([]);
 const [products, setProducts] = useState([]);
 const [activeTab, setActiveTab] = useState('details');

 useEffect(() => {
   const loadProducts = async () => {
     const productsData = await getProductsFromFirebase();
     setProducts(productsData || []);
   };
   loadProducts();
 }, []);

 useEffect(() => {
   if (service) {
     const mainCategory = service.mainCategory || service.category;
     setEditedService({
       ...service,
       id: service.id,
       mainCategory: mainCategory,
       hourly: Boolean(service.hourly),
       hasVariants: Boolean(service.hasVariants),
       isPackage: Boolean(service.isPackage),
       variants: service.variants || [],
     });
     setTasks(service.tasks || []);
   }
 }, [service]);

 useEffect(() => {
   if (service?.mainCategory && serviceGroups[service.mainCategory]?.items) {
     const uniqueSubcategories = [
       ...new Set(
         serviceGroups[service.mainCategory].items
           .map(item => item.subcategory)
           .filter(Boolean)
       )
     ];
     setSubcategories(uniqueSubcategories);
   }
 }, [service?.mainCategory, serviceGroups]);

 if (!editedService) return null;

 const handleChange = (e) => {
   const { name, value, type, checked } = e.target;
   setEditedService(prev => ({
     ...prev,
     [name]: type === 'checkbox' ? checked : value
   }));
 };

 const handleSave = () => {
   if (!editedService.name?.trim()) {
     alert('Název služby je povinný');
     return;
   }
   if (!editedService.price || isNaN(editedService.price)) {
     alert('Cena musí být platné číslo');
     return;
   }
 
   const serviceToSave = {
     ...editedService,
     id: editedService.id,
     mainCategory: editedService.mainCategory,
     name: editedService.name.trim(),
     price: Number(editedService.price),
     subcategory: editedService.subcategory || '',
     hourly: Boolean(editedService.hourly),
     hasVariants: editedService.hasVariants,
     variants: editedService.variants,
     isPackage: Boolean(editedService.isPackage),
     tasks: tasks
   };
 
   console.log('Data k uložení:', serviceToSave);
   onSave(serviceToSave);
 };

 return (
   <Modal isOpen={isOpen} onClose={onClose}>
     <div className="p-4">
       <div className="flex justify-between items-center mb-4">
         <h2 className="text-xl font-bold">Upravit službu</h2>
         <button
           onClick={() => {
             if (window.confirm('Opravdu chcete tuto službu smazat?')) {
               onDelete();
               onClose();
             }
           }}
           className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
         >
           <Trash2 size={20} />
         </button>
       </div>

       <div className="flex border-b mb-4">
         <button
           className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
           onClick={() => setActiveTab('details')}
         >
           Detaily služby
         </button>
         <button
           className={`px-4 py-2 ${activeTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
           onClick={() => setActiveTab('tasks')}
         >
           Úkoly
         </button>
       </div>

       {activeTab === 'details' && (
         <div className="space-y-4">
           <div className="form-section">
             <label className="block text-sm font-medium mb-1">Název služby:</label>
             <input
               type="text"
               name="name"
               value={editedService.name || ''}
               onChange={handleChange}
               className="w-full p-2 border rounded"
             />
           </div>

           <div className="form-section">
             <div className="flex items-center justify-between mb-1">
               <label className="text-sm font-medium">Podkategorie:</label>
               <span className="text-sm text-gray-500">(Přesunout do jiné podkategorie)</span>
             </div>
             <select
               name="subcategory"
               value={editedService.subcategory || ''}
               onChange={handleChange}
               className="w-full p-2 border rounded"
             >
               <option value="">Vyberte podkategorii</option>
               {subcategories.map((subcategory) => (
                 <option key={subcategory} value={subcategory}>
                   {subcategory}
                 </option>
               ))}
             </select>
           </div>

           <div className="form-section">
             <label className="block text-sm font-medium mb-1">Cena (Kč):</label>
             <input
               type="number"
               name="price"
               value={editedService.price || ''}
               onChange={handleChange}
               className="w-full p-2 border rounded"
             />
           </div>

           <div className="form-section">
             <label className="flex items-center space-x-2">
               <input
                 type="checkbox"
                 name="hourly"
                 checked={editedService.hourly || false}
                 onChange={handleChange}
                 className="rounded"
               />
               <span className="text-sm flex items-center">
                 Hodinová sazba
                 <Clock className="ml-2 h-4 w-4 text-gray-400" />
               </span>
             </label>
           </div>
         </div>
       )}

       {activeTab === 'tasks' && (
         <div className="space-y-4">
           {tasks.map((task, index) => (
             <div key={index} className="flex gap-4 items-start border p-4 rounded">
               <div className="flex-grow space-y-2">
                 <input
                   type="text"
                   value={task.description || ''}
                   onChange={(e) => {
                     const newTasks = [...tasks];
                     newTasks[index] = { ...newTasks[index], description: e.target.value };
                     setTasks(newTasks);
                   }}
                   className="w-full p-2 border rounded"
                   placeholder="Popis úkolu..."
                 />
                 <input
                   type="text"
                   value={task.warning || ''}
                   onChange={(e) => {
                     const newTasks = [...tasks];
                     newTasks[index] = { ...newTasks[index], warning: e.target.value };
                     setTasks(newTasks);
                   }}
                   className="w-full p-2 border rounded"
                   placeholder="Varování (volitelné)..."
                 />
                 <select
                   value={task.productId || ''}
                   onChange={(e) => {
                     const newTasks = [...tasks];
                     newTasks[index] = { ...newTasks[index], productId: e.target.value || null };
                     setTasks(newTasks);
                   }}
                   className="w-full p-2 border rounded"
                 >
                   <option value="">Vyberte doporučený produkt</option>
                   {products.map(product => (
                     <option key={product.id} value={product.id}>
                       {product.name}
                     </option>
                   ))}
                 </select>
               </div>
               <button
                 onClick={() => setTasks(tasks.filter((_, i) => i !== index))}
                 className="text-red-500 hover:text-red-700"
               >
                 <Trash2 size={20} />
               </button>
             </div>
           ))}
           <Button
             onClick={() => setTasks([...tasks, { description: '', warning: '', productId: '' }])}
             className="w-full"
           >
             <Plus size={20} className="mr-2" />
             Přidat úkol
           </Button>
         </div>
       )}

       <div className="flex justify-end space-x-2 mt-4">
         <Button variant="outline" onClick={onClose}>Zrušit</Button>
         <Button 
           onClick={() => {
             handleSave();
             onClose();
           }}
         >
           Uložit
         </Button>
       </div>
     </div>
   </Modal>
 );
};

export default EditServiceModal;