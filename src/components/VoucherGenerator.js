// components/VoucherGenerator.js
import React, { useState, useEffect } from 'react';
import { useServiceContext } from './ServiceContext';
import { getDatabase, ref, set, onValue, remove } from 'firebase/database';
import { FaTrash } from 'react-icons/fa';

const VoucherGenerator = () => {
  // Načtení balíčků a stavu načítání z ServiceContext
  const { packages, loading } = useServiceContext();
  
  // Stav pro již vytvořené poukazy
  const [vouchers, setVouchers] = useState([]);
  
  // Stav pro chybové hlášky validace
  const [errors, setErrors] = useState({
    recipientName: '',
    customAmount: '',
    selectedImage: ''
  });
  
  // Základní stav pro data voucheru
  const [voucherData, setVoucherData] = useState({
    recipientName: '',          // Jméno příjemce
    packageId: 'custom',        // ID balíčku nebo 'custom' pro vlastní částku
    customAmount: '',           // Vlastní částka (pouze pro custom voucher)
    message: '',               // Volitelné věnování
    validityMonths: 12,        // Platnost v měsících (přednastaveno na rok)
    selectedImage: ''          // Vybraný obrázek pro poukaz
  });

  // Načtení existujících voucherů z Firebase při inicializaci
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
    

    // Cleanup při odmontování komponenty
    return () => unsubscribe();
  }, []);

  // Automatický výběr obrázku při změně balíčku
  useEffect(() => {
    if (voucherData.packageId !== 'custom') {
      const defaultImage = getBackgroundImage(voucherData.packageId);
      setVoucherData(prev => ({
        ...prev,
        selectedImage: defaultImage
      }));
    }
  }, [voucherData.packageId]);

  // Určení typu balíčku podle jeho ID a názvu
 // Vylepšená funkce pro určení typu balíčku

 const getPackageType = (packageId) => {
    if (packageId === 'custom') return 'custom';
    
    // Použijeme přímo ID balíčku, pokud název není dostupný
    const packageIdentifier = packageId.toLowerCase();
    console.log('Kontroluji balíček:', packageIdentifier);
    
    // Kontrolujeme podle ID balíčku
    if (packageIdentifier.includes('keramick') || 
        packageIdentifier.includes('interier') || 
        packageIdentifier.includes('interiér')) {
      return 'premium';
    }
    
    if (packageIdentifier.includes('mytí') || 
        packageIdentifier.includes('čištění')) {
      return 'basic';
    }
    
    return 'basic';
  };

  // Získání cesty k obrázku podle typu balíčku
  const getBackgroundImage = (packageId) => {
    const type = getPackageType(packageId);
    return `voucher-${type}.jpg`;
  };


  // Automatický výběr obrázku při změně balíčku
  // Debug výpis pro packages
useEffect(() => {
    console.log('Dostupné balíčky:', packages);
  }, [packages]);
  
  useEffect(() => {
    if (voucherData.packageId !== 'custom') {
      const packageIdentifier = voucherData.packageId;
      const type = getPackageType(packageIdentifier);
      const defaultImage = `voucher-${type}.jpg`;
      
      console.log('Detaily balíčku:');
      console.log('- ID balíčku:', packageIdentifier);
      console.log('- Určený typ:', type);
      console.log('- Vybraný obrázek:', defaultImage);
      
      setVoucherData(prev => ({
        ...prev,
        selectedImage: defaultImage
      }));
    }
  }, [voucherData.packageId]);

  // Validace formuláře před odesláním
  const validateForm = () => {
    const newErrors = {
      recipientName: '',
      customAmount: '',
      selectedImage: ''
    };
    let isValid = true;

    // Validace jména příjemce (2-50 znaků, pouze písmena a mezery)
    if (!voucherData.recipientName.trim()) {
      newErrors.recipientName = 'Zadejte jméno příjemce';
      isValid = false;
    } else if (!/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s]{2,50}$/.test(voucherData.recipientName)) {
      newErrors.recipientName = 'Jméno může obsahovat pouze písmena a mezery (2-50 znaků)';
      isValid = false;
    }

    // Validace částky pro vlastní voucher
    if (voucherData.packageId === 'custom') {
      if (!voucherData.customAmount) {
        newErrors.customAmount = 'Zadejte částku';
        isValid = false;
      } else if (isNaN(voucherData.customAmount) || voucherData.customAmount <= 0) {
        newErrors.customAmount = 'Zadejte platnou částku';
        isValid = false;
      }
    }

    // Validace výběru obrázku pro vlastní voucher
    if (voucherData.packageId === 'custom' && !voucherData.selectedImage) {
      newErrors.selectedImage = 'Vyberte obrázek poukazu';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Generování unikátního kódu poukazu
  const generateVoucherCode = () => {
    const prefix = 'MV';
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${year}-${random}`;
  };
  
  // Výpočet data expirace voucheru
  const getExpirationDate = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  };

  // Zpracování odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kontrola validace před odesláním
    if (!validateForm()) {
      return;
    }

    try {
      const db = getDatabase();
      const voucherId = Date.now().toString();
      const voucherCode = generateVoucherCode();
      
      // Vytvoření objektu voucheru pro uložení
      const voucherToSave = {
        code: voucherCode,
        ...voucherData,
        createdAt: new Date().toISOString(),
        expiresAt: getExpirationDate(voucherData.validityMonths),
        status: 'active'
      };
      
      // Uložení do Firebase
      await set(ref(db, `vouchers/${voucherId}`), voucherToSave);
      alert('Poukaz byl úspěšně vytvořen!');
      
      // Reset formuláře po úspěšném vytvoření
      setVoucherData({
        recipientName: '',
        packageId: 'custom',
        customAmount: '',
        message: '',
        validityMonths: 12,
        selectedImage: ''
      });
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      alert('Chyba při vytváření poukazu: ' + error.message);
    }
  };

  // Smazání voucheru
  const handleDelete = async (voucherId) => {
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

  // Generování PDF souboru poukazu
  const generateVoucherPDF = async (voucher) => {
    try {
      // Výběr obrázku pro pozadí
      const backgroundImage = voucher.selectedImage || getBackgroundImage(voucher.packageId);

      // Načtení obrázku pozadí
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
              /* CSS styly pro poukaz */
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

        // Otevření nového okna pro tisk
        const printWindow = window.open('', '', 'height=600, width=800');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.print();
      };
    } catch (error) {
      console.error('Error při generování poukazu:', error);
    }
  };

  // Render komponenty
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dárkové poukazy</h1>
      
      {/* Formulář pro vytvoření poukazu */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* Výběr typu poukazu */}
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
          
          {/* Pole pro vlastní částku */}
          {voucherData.packageId === 'custom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Částka (Kč)
              </label>
              <input
                type="number"
                className={`w-full p-2 border rounded ${errors.customAmount ? 'border-red-500' : ''}`}
                value={voucherData.customAmount}
                onChange={(e) => setVoucherData({
                  ...voucherData,
                  customAmount: e.target.value
                })}
              />
              {errors.customAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.customAmount}</p>
              )}
            </div>
          )}

          {/* Pole pro jméno příjemce */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Pro koho
            </label>
            <input
              type="text"
              className={`w-full p-2 border rounded ${errors.recipientName ? 'border-red-500' : ''}`}
              value={voucherData.recipientName}
              onChange={(e) => setVoucherData({
                ...voucherData,
                recipientName: e.target.value
              })}
              maxLength={50}
            />
            {errors.recipientName && (
              <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>
            )}
          </div>

          {/* Pole pro věnování */}
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

          {/* Výběr platnosti */}
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

          {/* Výběr obrázku pro poukaz */}
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    Vyberte obrázek pro poukaz
  </label>
  <div className="flex space-x-4">
    {[
      { file: 'voucher-basic.jpg', label: 'Mytí', type: 'basic' },
      { file: 'voucher-premium.jpg', label: 'Interiér', type: 'premium' },
      { file: 'voucher-custom.jpg', label: 'Keramika', type: 'custom' }
    ].map((img, index) => (
      <div 
        key={index}
        className={`
          relative cursor-pointer rounded-lg overflow-hidden
          transition-all duration-200
          ${voucherData.selectedImage === img.file 
            ? 'ring-4 ring-blue-500 shadow-lg transform scale-105' 
            : 'hover:ring-2 hover:ring-blue-300'
          }
        `}
        onClick={() => setVoucherData({ ...voucherData, selectedImage: img.file })}
      >
        <img 
          src={`${process.env.PUBLIC_URL}/${img.file}`} 
          alt={`miniatura ${img.label}`} 
          className="w-32 h-32 object-cover"
        />
        {/* Překrytí s popiskem */}
        <div className={`
          absolute bottom-0 left-0 right-0 
          bg-gradient-to-t from-black/70 to-transparent
          p-2 text-center
        `}>
          <span className="text-white text-sm font-medium">{img.label}</span>
        </div>
        {/* Indikátor výběru */}
        {voucherData.selectedImage === img.file && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    ))}
  </div>
  {errors.selectedImage && (
    <p className="text-red-500 text-sm mt-1">{errors.selectedImage}</p>
  )}
</div>

          {/* Tlačítko pro vytvoření poukazu */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Vytvořit poukaz
          </button>
        </form>
      </div>

      {/* Seznam vytvořených poukazů */}
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
                {/* Tlačítko pro smazání voucheru */}
                <button
                  onClick={() => handleDelete(voucher.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoucherGenerator