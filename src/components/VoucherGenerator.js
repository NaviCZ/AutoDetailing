// components/VoucherGenerator.js
import React, { useState, useEffect } from 'react';
import { useServiceContext } from './ServiceContext';
import { getDatabase, ref, set, onValue, remove } from 'firebase/database';

const VoucherGenerator = () => {
  // Získání balíčků a načítacího stavu ze ServiceContext
  const { packages, loading } = useServiceContext();
  // Stav pro již vytvořené poukazy
  const [vouchers, setVouchers] = useState([]);
  // Stav pro data voucheru, včetně pole pro vybraný obrázek (miniaturu)
  const [voucherData, setVoucherData] = useState({
    recipientName: '',
    packageId: 'custom',
    customAmount: '',
    message: '',
    validityMonths: 12,
    selectedImage: '' // zde se uloží cesta k vybrané miniatuře
  });

  // Načtení existujících voucherů z Firebase databáze
  useEffect(() => {
    const db = getDatabase();
    const vouchersRef = ref(db, 'vouchers');

    const unsubscribe = onValue(vouchersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const voucherList = Object.entries(data).map(([id, voucher]) => ({
          id,
          ...voucher
        }));
        setVouchers(voucherList);
      }
    });

    return () => unsubscribe();
  }, []);

  // Debug výpis dostupných balíčků
  useEffect(() => {
    console.log('Dostupné balíčky:', packages);
  }, [packages]);

  // Debug výpis načtených voucherů
  useEffect(() => {
    console.log('Načtené vouchery:', vouchers);
  }, [vouchers]);

  // Další debug výpis ze ServiceContext
  useEffect(() => {
    console.log('ServiceContext packages:', packages);
    console.log('Loading:', loading);
  }, [packages, loading]);

  // Funkce pro určení typu balíčku na základě ID a jeho názvu
  const getPackageType = (packageId) => {
    if (packageId === 'custom') return 'custom';
    
    const packageName = packages[packageId]?.name?.toLowerCase() || '';
    
    if (packageName.includes('keramick')) return 'premium';
    if (packageName.includes('mytí') || packageName.includes('čištění')) return 'basic';
    
    return 'custom'; // výchozí typ
  };

  // Funkce pro automatický výběr obrázku podle typu balíčku
  const getBackgroundImage = (packageId) => {
    const type = getPackageType(packageId);
    return `voucher-${type}.jpg`;
  };

  // Funkce pro generování PDF poukazu
  const generateVoucherPDF = async (voucher) => {
    try {
      console.log('Generuji poukaz pro balíček:', voucher.packageId);
      console.log('Typ balíčku:', getPackageType(voucher.packageId));
      
      // Použije se vybraný obrázek (miniatura) uložená ve voucheru, nebo automatický výběr
      const backgroundImage = voucher.selectedImage || getBackgroundImage(voucher.packageId);
      console.log('Použité pozadí:', backgroundImage);

      // Načtení obrázku a převod na base64
      const response = await fetch(`${process.env.PUBLIC_URL}/${backgroundImage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        
        // HTML šablona pro PDF poukaz
        const pdfContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
            <style>
              .voucher {
                width: 800px;
                height: 400px;
                position: relative;
                background: #000 url('${base64data}') center/cover no-repeat;
                color: white;
                border-radius: 10px;
                overflow: hidden;
                display: grid;
                grid-template-columns: 1fr 1fr;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              }
  
              .logo-container {
                background: white;
                border-radius: 100%;
                width: 150px;
                height: 150px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 30px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              }
  
              .logo {
                width: 85%;
                height: 85%;
                object-fit: contain;
              }
  
              .left-side {
                z-index: 2;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
  
              .title {
                font-family: 'Playfair Display', serif;
                font-size: 48px;
                font-weight: 700;
                margin: 20px 0;
                letter-spacing: 2px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                color: #ffffff;
                text-align: center;
              }
  
              .right-side {
                background: rgba(255, 255, 255, 0.95);
                padding: 20px;
                margin: 10px;
                border-radius: 8px;
                color: #000;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
  
              .field {
                margin-bottom: 20px;
              }
  
              .field-label {
                color: #666;
                font-size: 14px;
                margin-bottom: 2px;
                font-family: 'Roboto', sans-serif;
              }
  
              .field-value {
                border-bottom: 1px solid #ccc;
                padding: 5px 0;
                font-size: 16px;
                font-family: 'Roboto', sans-serif;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="voucher">
              <div class="left-side">
                <div class="logo-container">
                  <img src="${process.env.PUBLIC_URL}/Logo.png" class="logo" alt="MV Auto Detailing">
                </div>
                <div class="title">DÁRKOVÝ POUKAZ</div>
              </div>
              
              <div class="right-side">
                <div class="field">
                  <div class="field-label">Pro:</div>
                  <div class="field-value">${voucher.recipientName}</div>
                </div>

                <div class="field">
                  <div class="field-label">${voucher.packageId === 'custom' ? 'Hodnota:' : 'Balíček:'}</div>
                  <div class="field-value">${
                    voucher.packageId === 'custom' 
                      ? `${Number(voucher.customAmount).toLocaleString()} Kč`
                      : packages[voucher.packageId]?.name || voucher.packageId
                  }</div>
                </div>

                ${voucher.message ? `
                  <div class="field">
                    <div class="field-label">Věnování:</div>
                    <div class="field-value">${voucher.message}</div>
                  </div>
                ` : ''}
                
                <div class="field">
                  <div class="field-label">Číslo poukazu:</div>
                  <div class="field-value">${voucher.code}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Platnost do:</div>
                  <div class="field-value">${new Date(voucher.expiresAt).toLocaleDateString('cs-CZ')}</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Otevření nového okna a vyvolání tisku (PDF)
        const printWindow = window.open('', '', 'height=600, width=800');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.print();
      };
    } catch (error) {
      console.error('Error při generování poukazu:', error);
    }
  };

  // Funkce pro generování unikátního kódu poukazu
  const generateVoucherCode = () => {
    const prefix = 'MV';
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${year}-${random}`;
  };
  
  // Funkce pro výpočet data expirace voucheru
  const getExpirationDate = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  };

  // Funkce, která se spustí při odeslání formuláře pro vytvoření voucheru
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const db = getDatabase();
      const voucherId = Date.now().toString();
      const voucherCode = generateVoucherCode();
      
      // Vytvoření objektu voucheru, který se uloží do databáze
      const voucherToSave = {
        code: voucherCode,
        ...voucherData,
        createdAt: new Date().toISOString(),
        expiresAt: getExpirationDate(voucherData.validityMonths),
        status: 'active'
      };
      
      await set(ref(db, `vouchers/${voucherId}`), voucherToSave);
      alert('Poukaz byl úspěšně vytvořen!');
      
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      alert('Chyba při vytváření poukazu: ' + error.message);
    }
  };

  // Funkce pro smazání voucheru podle jeho ID
  const handleDelete = async (voucherId) => {
    // Dotaz na potvrzení smazání
    if (!window.confirm("Opravdu chcete smazat tento poukaz?")) return;
    try {
      const db = getDatabase();
      await remove(ref(db, `vouchers/${voucherId}`));
      alert("Poukaz byl úspěšně smazán.");
    } catch (error) {
      console.error("Chyba při mazání poukazu:", error);
      alert("Chyba při mazání poukazu: " + error.message);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dárkové poukazy</h1>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* Výběr typu poukazu: balíček nebo vlastní částka */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Typ poukazu
            </label>
            <select 
              className="w-full p-2 border rounded"
              value={voucherData.packageId}
              onChange={(e) => setVoucherData({
                ...voucherData,
                packageId: e.target.value
              })}
            >
              <option value="custom">Vlastní částka</option>
              {Object.entries(packages || {}).map(([name, packageData]) => (
                <option key={name} value={name}>
                  {name} - {packageData.price?.toLocaleString()} Kč
                </option>
              ))}
            </select>
          </div>
          
          {/* Pokud je vybrána možnost "custom", zobrazí se pole pro zadání vlastní částky */}
          {voucherData.packageId === 'custom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Částka (Kč)
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={voucherData.customAmount}
                onChange={(e) => setVoucherData({
                  ...voucherData,
                  customAmount: e.target.value
                })}
              />
            </div>
          )}

          {/* Vstup pro jméno příjemce */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Pro koho
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={voucherData.recipientName}
              onChange={(e) => setVoucherData({
                ...voucherData,
                recipientName: e.target.value
              })}
            />
          </div>

          {/* Vstup pro volitelné věnování */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Věnování (nepovinné)
            </label>
            <textarea
              className="w-full p-2 border rounded"
              value={voucherData.message}
              onChange={(e) => setVoucherData({
                ...voucherData,
                message: e.target.value
              })}
            />
          </div>

          {/* Výběr platnosti voucheru */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Platnost
            </label>
            <select
              className="w-full p-2 border rounded"
              value={voucherData.validityMonths}
              onChange={(e) => setVoucherData({
                ...voucherData,
                validityMonths: parseInt(e.target.value)
              })}
            >
              <option value={6}>6 měsíců</option>
              <option value={12}>1 rok</option>
              <option value={24}>2 roky</option>
            </select>
          </div>

          {/* Sekce pro výběr miniatury (obrázku) pro poukaz */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Vyberte obrázek pro poukaz
            </label>
            <div className="flex space-x-4">
              {['voucher-basic.jpg', 'voucher-premium.jpg', 'voucher-custom.jpg'].map((img, index) => (
                <div key={index} 
                     className={`cursor-pointer border-2 p-1 ${voucherData.selectedImage === img ? 'border-blue-600' : 'border-transparent'}`}
                     onClick={() => setVoucherData({ ...voucherData, selectedImage: img })}>
                  <img src={`${process.env.PUBLIC_URL}/${img}`} alt={`miniatura ${index}`} className="w-20 h-20 object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Tlačítko pro odeslání formuláře a vytvoření voucheru */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Vytvořit poukaz
          </button>
        </form>
      </div>

      {/* Seznam vytvořených voucherů */}
      <div className="max-w-2xl mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">Vytvořené poukazy</h2>
        <div className="space-y-4">
          {vouchers.map(voucher => (
            <div key={voucher.id} 
                 className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{voucher.recipientName}</p>
                <p className="text-sm text-gray-600">
                  {voucher.packageId === 'custom' 
                    ? `Vlastní částka: ${Number(voucher.customAmount).toLocaleString()} Kč`
                    : `Balíček: ${packages[voucher.packageId]?.name || voucher.packageId}`
                  }
                </p>
                <p className="text-sm text-gray-600">Kód: {voucher.code}</p>
                <p className="text-sm text-gray-600">
                  Platnost do: {new Date(voucher.expiresAt).toLocaleDateString('cs-CZ')}
                </p>
              </div>
              <div className="flex space-x-2">
                {/* Tlačítko pro stažení PDF */}
                <button
                  onClick={() => generateVoucherPDF(voucher)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Stáhnout PDF
                </button>
                {/* Tlačítko pro smazání voucheru s ikonou koše */}
                <button
                  onClick={() => handleDelete(voucher.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoucherGenerator;
