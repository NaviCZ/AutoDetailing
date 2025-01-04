import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, ExternalLink, Trash2, Edit2, Save, X, Car, Wrench, Box, Sofa } from 'lucide-react';
import { saveProductToFirebase, getProductsFromFirebase, deleteProductFromFirebase } from './Firebase';
import { auth } from './Firebase';
import { serverTimestamp } from "firebase/database";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'interior',
    description: '',
    price: '',
    supplier: '',
    link: '',
    notes: '',
    image: ''
  });

  const categories = [
    { id: 'interior', name: 'Interiér', icon: <Sofa size={20} /> },
    { id: 'exterior', name: 'Exteriér', icon: <Car size={20} /> },
    { id: 'tools', name: 'Nářadí', icon: <Wrench size={20} /> },
    { id: 'other', name: 'Ostatní', icon: <Box size={20} /> }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    console.log('Načítám produkty...');
    const fetchedProducts = await getProductsFromFirebase();
    console.log('Načtené produkty:', fetchedProducts);
    setProducts(fetchedProducts);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userEmail = auth.currentUser ? auth.currentUser.email : 'neznámý uživatel';
    console.log('Aktuální uživatel:', userEmail); // Pro debugging
    
    if (editingProduct) {
      console.log('Editace produktu:', editingProduct.id); // Pro debugging
      await saveProductToFirebase({ ...newProduct, id: editingProduct.id }, userEmail);
      setEditingProduct(null);
    } else {
      await saveProductToFirebase(newProduct, userEmail);
    }
    resetForm();
    loadProducts();
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      category: 'interior',
      description: '',
      price: '',
      supplier: '',
      link: '',
      notes: '',
      image: ''
    });
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    console.log('Mažu produkt s ID:', productId);
    const success = await deleteProductFromFirebase(productId);
    if (success) {
      setProducts(products.filter(product => product.id !== productId));
      console.log('Produkt byl úspěšně smazán');
    } else {
      console.error('Nepodařilo se smazat produkt');
    }
  };
  

  const cancelEdit = () => {
    resetForm();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Správa produktů</h1>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus size={20} />
          Přidat produkt
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingProduct !== null ? 'Upravit produkt' : 'Nový produkt'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Název</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cena (Kč)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dodavatel</label>
                  <input
                    type="text"
                    value={newProduct.supplier}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Odkaz na produkt</label>
                  <input
                    type="url"
                    value={newProduct.link}
                    onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Odkaz na obrázek</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="https://..."
                    />
                    {newProduct.image && (
  <div className="mt-2">
    <img
      src={newProduct.image}
      alt="Náhled"
      className="max-w-full h-auto max-h-48 object-contain rounded"
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
      }}
    />
  </div>
)}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Popis</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Poznámky</label>
                  <textarea
                    value={newProduct.notes}
                    onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <X className="mr-2" size={20} />
                  Zrušit
                </Button>
                <Button type="submit">
                  <Save className="mr-2" size={20} />
                  {editingProduct !== null ? 'Uložit změny' : 'Uložit produkt'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {categories.map(category => (
    <Card key={category.id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {category.icon}
          {category.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products
            .filter(product => product.category === category.id)
            .map((product) => (
              <div key={product.id} className="border p-4 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold">{product.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(product)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                {product.image && (
  <img
    src={product.image}
    alt={product.name}
    className="w-full h-auto max-h-48 object-contain mt-2 rounded"
    onError={(e) => {
      e.target.onerror = null;
      e.target.style.display = 'none';
    }}
  />
)}
                {product.description && (
                  <p className="text-gray-600 mt-1">{product.description}</p>
                )}
                <div className="mt-2 space-y-1">
                  {product.price && (
                    <p className="text-blue-600 font-bold">
                      {parseInt(product.price).toLocaleString()} Kč
                    </p>
                  )}
                  {product.supplier && (
                    <p className="text-sm text-gray-500">
                      Dodavatel: {product.supplier}
                    </p>
                  )}
                  {product.notes && (
                    <p className="text-sm text-gray-500">
                      Poznámky: {product.notes}
                    </p>
                  )}
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink size={16} />
                      Odkaz na produkt
                    </a>
                  )}
                  {/* Přidáno: Informace o uložení produktu */}
                  {product.createdBy && product.createdAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Uživatel: {product.createdBy} dne{' '}
                      {product.createdAt ? new Date(product.createdAt).toLocaleString('cs-CZ') : 'Neznámé datum'}

                    </p>
                  )}
                </div>
              </div>
            ))}
          {products.filter(product => product.category === category.id).length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Žádné produkty v této kategorii
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  ))}
</div>

    </div>
  );
};

export default ProductManagement;
