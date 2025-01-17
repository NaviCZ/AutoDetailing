import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, ExternalLink, Trash2, Edit2, Save, X, Car, Wrench, Box, Sofa } from 'lucide-react';
import { saveProductToFirebase, getProductsFromFirebase, deleteProductFromFirebase } from './Firebase';
import { auth } from './Firebase';
import { serverTimestamp } from "firebase/database";

const ProductManagement = () => {
  const [products, setProducts] = useState([]); // Stav pro uchování seznamu produktů
  const [showAddForm, setShowAddForm] = useState(false); // Stav pro zobrazení/skrytí formuláře
  const [editingProduct, setEditingProduct] = useState(null); // Stav pro editaci produktu
  const [newProduct, setNewProduct] = useState({ // Stav pro nový produkt
    name: '',
    category: 'interior',
    description: '',
    price: '',
    supplier: '',
    link: '',
    notes: '',
    image: ''
  });

  // Kategorie produktů
  const categories = [
    { id: 'interior', name: 'Interiér', icon: <Sofa size={20} /> },
    { id: 'exterior', name: 'Exteriér', icon: <Car size={20} /> },
    { id: 'tools', name: 'Nářadí', icon: <Wrench size={20} /> },
    { id: 'other', name: 'Ostatní', icon: <Box size={20} /> }
  ];

  // Načtení produktů při prvním renderu
  useEffect(() => {
    loadProducts();
  }, []);

  // Funkce pro načtení produktů z Firebase
  const loadProducts = async () => {
    console.log('Načítám produkty...');
    const fetchedProducts = await getProductsFromFirebase();
    console.log('Načtené produkty:', fetchedProducts);
    setProducts(fetchedProducts);
  };

  // Funkce pro uložení nebo editaci produktu
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userEmail = auth.currentUser ? auth.currentUser.email : 'neznámý uživatel';
    console.log('Aktuální uživatel:', userEmail); // Pro debugging
    
    if (editingProduct) {
      console.log('Editace produktu:', editingProduct.id); // Pro debugging
      await saveProductToFirebase({ ...newProduct, id: editingProduct.id }, userEmail);
      setEditingProduct(null); // Ukončení režimu editace
    } else {
      await saveProductToFirebase(newProduct, userEmail); // Uložení nového produktu
    }
    resetForm(); // Resetování formuláře
    loadProducts(); // Znovunačtení produktů
  };

  // Funkce pro resetování formuláře
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
    setShowAddForm(false); // Skrytí formuláře
    setEditingProduct(null); // Ukončení režimu editace
  };

  // Funkce pro zahájení editace produktu
  const startEditing = (product) => {
    setEditingProduct(product); // Nastavení produktu do režimu editace
    setNewProduct(product); // Předvyplnění formuláře
    setShowAddForm(true); // Zobrazení formuláře
  };

  // Funkce pro smazání produktu
  const handleDeleteProduct = async (productId) => {
    console.log('Mažu produkt s ID:', productId);
    const success = await deleteProductFromFirebase(productId);
    if (success) {
      setProducts(products.filter(product => product.id !== productId)); // Aktualizace seznamu produktů
      console.log('Produkt byl úspěšně smazán');
    } else {
      console.error('Nepodařilo se smazat produkt');
    }
  };

  // Funkce pro zrušení editace
  const cancelEdit = () => {
    resetForm(); // Resetování formuláře
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Hlavička stránky s tlačítkem pro přidání produktu */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Správa produktů</h1>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus size={20} />
          Přidat produkt
        </Button>
      </div>

      {/* Formulář pro přidání/úpravu produktu */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingProduct !== null ? 'Upravit produkt' : 'Nový produkt'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pole pro název produktu */}
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
                {/* Pole pro kategorii produktu */}
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
                {/* Pole pro cenu produktu */}
                <div>
                  <label className="block text-sm font-medium mb-1">Cena (Kč)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                {/* Pole pro dodavatele produktu */}
                <div>
                  <label className="block text-sm font-medium mb-1">Dodavatel</label>
                  <input
                    type="text"
                    value={newProduct.supplier}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                {/* Pole pro odkaz na produkt */}
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
                {/* Pole pro odkaz na obrázek produktu */}
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
                {/* Pole pro popis produktu */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Popis</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>
                {/* Pole pro poznámky k produktu */}
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
              {/* Tlačítka pro uložení nebo zrušení */}
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

      {/* Zobrazení produktů podle kategorií */}
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
                          {/* Tlačítko pro editaci produktu */}
                          <button
                            onClick={() => startEditing(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={20} />
                          </button>
                          {/* Tlačítko pro smazání produktu */}
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      {/* Zobrazení obrázku produktu */}
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
                      {/* Zobrazení popisu produktu */}
                      {product.description && (
                        <p className="text-gray-600 mt-1">{product.description}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        {/* Zobrazení ceny produktu */}
                        {product.price && (
                          <p className="text-blue-600 font-bold">
                            {parseInt(product.price).toLocaleString()} Kč
                          </p>
                        )}
                        {/* Zobrazení dodavatele produktu */}
                        {product.supplier && (
                          <p className="text-sm text-gray-500">
                            Dodavatel: {product.supplier}
                          </p>
                        )}
                        {/* Zobrazení poznámek k produktu */}
                        {product.notes && (
                          <p className="text-sm text-gray-500">
                            Poznámky: {product.notes}
                          </p>
                        )}
                        {/* Zobrazení odkazu na produkt */}
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
                        {/* Zobrazení informací o uložení produktu */}
                        {product.createdBy && product.createdAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            Uživatel: {product.createdBy} dne{' '}
                            {product.createdAt ? new Date(product.createdAt).toLocaleString('cs-CZ') : 'Neznámé datum'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {/* Zobrazení zprávy, pokud v kategorii nejsou žádné produkty */}
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