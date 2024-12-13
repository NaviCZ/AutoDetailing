import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Printer, Download, Calculator } from 'lucide-react';
import jsPDF from "jspdf";
import "jspdf-autotable";
import CZFontPDF from "./CZFontPDF-normal.js"; // váš vlastní font
import { useReactToPrint } from 'react-to-print';

const CAR_SIZE_MARKUP = 0.3; // 30% příplatek pro XL vozy

const PDFGenerator = ({
  customerName,
  customerPhone,
  vehicleNotes,
  serviceGroups,
  selectedServices,
  serviceHours,
  totalPrice,
  discount,
  discountAmount,
  carSize,
  finalPrice,
  additionalCharges,
  additionalNotes,
  selectedPackages
  
}) => {
  const generatePDF = () => {
    const generateServiceTable = (category) => {
      const categoryServices = serviceGroups[category]
        .filter(group =>
          (group.services || group.options).some(service => selectedServices.has(service.id))
        )
        .flatMap(group =>
          (group.services || group.options)
            .filter(service => selectedServices.has(service.id))
            .map(service => {
              const hours = service?.hourly ? serviceHours[service.id] || 1 : null;
              const totalServicePrice = hours ? service.price * hours : service.price;

              // Upravený formát pro hodinové služby
              const serviceName = hours
                ? `${service.name.replace('/ 1h', '')} (${hours} h)`
                : service.name;

              return `
                <tr class="${category === 'interior' ? 'bg-blue-50' : 'bg-green-50'}">
                  <td>${serviceName}</td>
                  <td style="white-space: nowrap;">${Math.round(totalServicePrice).toLocaleString()} Kč</td>
                </tr>
              `;
            })
        )
        const additionalChargesTable = additionalCharges
      .filter(charge => charge.amount > 0)
      .map((charge) => `
        <tr>
          <td>${charge.description}</td>
          <td style="white-space: nowrap;">${Math.round(charge.amount).toLocaleString()} Kč</td>
        </tr>
      `).join('');

      return categoryServices ? `
        <h2>${category === 'interior' ? 'Interiér' : 'Exteriér'}</h2>
        <table>
          <thead>
            <tr>
              <th>Služba</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody>
            ${categoryServices}
          </tbody>
        </table>
      ` : '';
    };

    const generatePackageTable = (packageName, services) => {
      const packageServices = services
        .map(serviceId => {
          const service = [...serviceGroups.interior.flatMap(group => group.services || group.options || []),
                           ...serviceGroups.exterior.flatMap(group => group.services || group.options || [])]
                          .find(service => service.id === serviceId);
          const hours = service?.hourly ? serviceHours[service.id] || 1 : null;
          const totalServicePrice = hours ? service.price * hours : service.price;

          // Upravený formát pro hodinové služby
          const serviceName = hours
            ? `${service.name.replace('/ 1h', '')} (${hours} h)`
            : service.name;

          return `
            <tr>
              <td>${serviceName}</td>
              <td style="white-space: nowrap;">${Math.round(totalServicePrice).toLocaleString()} Kč</td>
            </tr>
          `;
        })
        .join('');

      return `
        <h2>${packageName}</h2>
        <table>
          <thead>
            <tr>
              <th>Služba</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody>
            ${packageServices}
          </tbody>
        </table>
      `;
    };

    const interiorServices = generateServiceTable('interior');
    const exteriorServices = generateServiceTable('exterior');

    const additionalChargesTable = additionalCharges.map((charge, index) => `
  <tr>
    <td>${charge.description}</td>
    <td style="white-space: nowrap;">${Math.round(charge.amount).toLocaleString()} Kč</td>
  </tr>
`).join('');

    const packageTables = Object.entries(selectedPackages).map(([packageName, services]) =>
      generatePackageTable(packageName, services)
    ).join('');

    const pdfContent = `
      <!DOCTYPE html>
      <html lang="cs">
      <html>
        <head>
          <title>Faktura - MV Auto Detailing</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
            }
            .logo {
              max-width: 150px;
              display: block;
              margin: 0 auto 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #e0e0e0;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0e0;
            }
            h1, h2 {
              text-align: center;
              color: #333;
              border-bottom: 2px solid #4a90e2;
              padding-bottom: 10px;
            }
            .section-note {
              background-color: #f9f9f9;
              border: 1px solid #e0e0e0;
              padding: 10px;
              margin-bottom: 20px;
              text-align: center;
              font-style: italic;
            }
            .final-price {
              font-weight: bold;
              color: black;
            }
            .highlight {
              font-weight: bold;
              color: red;
            }
          </style>
        </head>
        <body>
          <img src="./Logo.png" alt="Logo firmy" class="logo" />
          <h1>MV Auto Detailing - Faktura</h1>

          <h2>Zákaznické údaje</h2>
          <p><strong>Zákazník:</strong> ${customerName}</p>
          <p><strong>Telefon:</strong> ${customerPhone}</p>
          <p><strong>Poznámky k vozidlu:</strong> ${vehicleNotes}</p>
          <p><strong>Datum:</strong> ${new Date().toLocaleDateString('cs-CZ')}</p>

          ${!interiorServices && !exteriorServices && !packageTables ?
            '<div class="section-note">Nebyly vybrány žádné služby</div>' :
            `
              
              ${packageTables}
            `
          }

          ${additionalCharges.some(charge => charge.amount > 0) ? `
            <h2>Dodatečné náklady</h2>
            <table>
              <thead>
                <tr>
                  <th>Popis</th>
                  <th>Cena</th>
                </tr>
              </thead>
              <tbody>
                ${additionalChargesTable}
              </tbody>
            </table>
          ` : ''}

          <h2>Shrnutí</h2>
          <table>
            <tbody>
              <tr>
                <td>Celková cena služeb</td>
                <td>${totalPrice.toLocaleString()} Kč</td>
              </tr>
              ${discount > 0 ? `
                <tr>
                  <td>Sleva (${discount}%)</td>
                  <td style="white-space: nowrap;">-${Math.round(discountAmount).toLocaleString()} Kč</td>
                </tr>
              ` : ''}
              ${carSize === 'XL' ? `
                <tr>
                  <td>Příplatek za vůz XL (${CAR_SIZE_MARKUP * 100}%)</td>
                  <td style="white-space: nowrap;">+${Math.round(totalPrice * CAR_SIZE_MARKUP).toLocaleString()} Kč</td>
                </tr>
              ` : ''}
              ${additionalCharges.length > 0 ? `
                <tr>
                  <td>Dodatečné náklady</td>
                  <td style="white-space: nowrap;">+${Math.round(additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)).toLocaleString()} Kč</td>
                </tr>
              ` : ''}
              <tr class="final-price">
                <td>Konečná cena k zaplacení</td>
                <td style="white-space: nowrap;">${Math.round(finalPrice).toLocaleString()} Kč</td>
              </tr>
            </tbody>
          </table>

          ${additionalNotes ? `
            <div class="highlight">
              <h2>Poznámky</h2>
              <p>${additionalNotes}</p>
            </div>
          ` : ''}

          <p style="text-align: center; margin-top: 20px;">Děkujeme za Vaši důvěru a těšíme se na další spolupráci.</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=500, width=800');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Generovat fakturu
    </button>
  );
};

const AutoDetailingCalculator = () => {
  const [carSize, setCarSize] = useState('M');
  const [discount, setDiscount] = useState(15);
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [serviceVariants, setServiceVariants] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNotes, setVehicleNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [serviceHours, setServiceHours] = useState({});
  const [additionalCharges, setAdditionalCharges] = useState([{ description: '', amount: 0 }]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedPackages, setSelectedPackages] = useState({});

  const serviceGroups = {
    interior: [
      {
        id: 'basic',
        name: 'Základní služby',
        services: [
          { id: 'vac', name: 'Důkladné vysátí celého vozu vč. zavazadlového prostoru', price: 300 },
          { id: 'mats', name: 'Mytí gumových koberečků + prémiová impregnace', price: 150 },
          { id: 'perfume', name: 'Provonění interiéru', price: 50 }
        ]
      },
      {
        id: 'plastics',
        name: 'Péče o plasty',
        services: [
          { id: 'plastics_basic', name: 'Čistění všech plastů v interiéru (madla dveří, řadící páka, pedály, výdechů, kolejniček atd.)', price: 500 },
          { id: 'plastics_premium', name: 'Prémiová impregnace a konzervace plastů', price: 500 }
        ]
      },
      {
        id: 'cleaning',
        name: 'Čištění a tepování',
        services: [
          { id: 'carpet_mats', name: 'Tepování texilních koberečků', price: 200 },
          { id: 'carpets', name: 'Tepování podlahových koberců', price: 700 }
        ]
      },
      {
        id: 'seats',
        name: 'Péče o sedačky',
        type: 'select',
        options: [
          { id: 'seats_textile', name: 'Tepování textilních sedaček', price: 1800 },
          { id: 'seats_leather', name: 'Důkladné a šetrné čištění kůže + výživa a impregnace', price: 1600 }
        ]
      },
      {
        id: 'additional',
        name: 'Další služby',
        services: [
          { id: 'seal_impregnation', name: 'Impregnace těsnění dveří', price: 200 },
          { id: 'ceiling_cleaning', name: 'Čistění stropnice', price: 500 },
          { id: 'pet_hair_removal', name: 'Odstranění zvířecích chlupů', price: 300 },
          { id: 'seatbelt_cleaning', name: 'Čištění bezpečnostních pásů', price: 300 },
          { id: 'ac_cleaning', name: 'Čištění klimatizace a interiéru ozónem', price: 300 },
          { id: 'steam_cleaning', name: 'Parní hloubkové čištění / 1h', price: 350, hourly: true },
          { id: 'leather_renovation', name: 'Renovace kůže autosedaček 2ks', price: 1000 },
          { id: 'leather_ceramic', name: 'Keramika na kůži', price: 1200 },
          { id: 'plastics_ceramic', name: 'Keramika na plasty v interiéru', price: 800 }
        ]
      }
    ],
    exterior: [
      {
        id: 'basic_exterior',
        name: 'Základní mytí',
        services: [
          { id: 'foam', name: 'Předmytí aktivní pěnou', price: 100 },
          { id: 'wash', name: 'Ruční mytí šampónem', price: 400 },
          { id: 'wheels', name: 'Důkladné mytí kol a pneumatik', price: 100 },
          { id: 'door_cleaning', name: 'Mytí a hloubkové čištění mezidveřních prostor včetně ochrany', price: 250 }
        ]
      },
      {
        id: 'decontamination',
        name: 'Dekontaminace',
        services: [
          { id: 'clay_mechanical', name: 'Mechanická dekontaminace CLAY', price: 900 },
          { id: 'chemical_body', name: 'Chemická dekontaminace laku karoserie - PH neutral', price: 500 },
          { id: 'chemical_wheels', name: 'Chemická dekontaminace 4 kol - PH neutral', price: 250 }
        ]
      },
      {
        id: 'windows',
        name: 'Ošetření oken',
        services: [
          { id: 'window_polish', name: 'Vyleštění všech oken z obou stran', price: 300 },
          { id: 'glass_ceramic_1y', name: 'Keramická ochrana všech skel až s 1 roční účinností', price: 700 }
        ]
      },
      {
        id: 'waxing',
        name: 'Vosk',
        type: 'select',
        options: [
          { id: 'hard_wax', name: 'Tuhý vosk', price: 1600 },
          { id: 'quick_wax', name: 'Rychlovosk', price: 600 }
        ]
      },
      {
        id: 'polish',
        name: 'Leštění',
        type: 'select',
        options: [
          { id: 'polish_basic', name: 'Leštění základní: Nepoškozený lak (před aplikací keramické ochrany) nové vozidlo, před aplikací keramické ochrany', price: 5000 },
          { id: 'polish_one_step', name: 'Leštění jednokrokovou pastou odstranění 60-70% defektů laku', price: 7000 },
          { id: 'polish_multi_step', name: 'Leštění vícekrokovou pastou až 95% defektů laku', price: 9000 }
        ]
      },
      {
        id: 'ceramic_protection',
        name: 'Keramická ochrana laku',
        type: 'select',
        options: [
          { id: 'ceramic_1y', name: 'Keramická ochrana laku s 1 roční účinností', price: 4000 },
          { id: 'ceramic_2y', name: 'Keramická ochrana laku až s 2 roční účinností', price: 7000 },
          { id: 'ceramic_3y', name: 'Keramická ochrana laku až s 3 roční účinností', price: 9000 },
          { id: 'ceramic_5y', name: 'Keramická ochrana laku až s 5 roční účinností / dvě vrstvy', price: 12000 }
        ]
      },
      {
        id: 'ceramic_extras',
        name: 'Keramická ochrana exteriérových plastů a světel ',
        type: 'select',
        options: [
          { id: 'plastics_ceramic_1y', name: 'Keramická ochrana exteriérových plastů a světel až s 1 roční účinností', price: 1500 },
          { id: 'plastics_ceramic_2y', name: 'Keramická ochrana exteriérových plastů a světel až s 2 roční účinností', price: 1800 },
          { id: 'plastics_ceramic_3y', name: 'Keramická ochrana exteriérových plastů a světel až s 3 roční účinností', price: 2100 },
          { id: 'plastics_ceramic_5y', name: 'Keramická ochrana exteriérových plastů a světel až s 5 roční účinností', price: 2500 }
          ]
      },
      {
        id: 'additional_protection',
        name: 'Další ochrany',
        services: [
          { id: 'plastic_tire_impregnation', name: 'Impregnace venkovních plastů a pneu', price: 300 },
          { id: 'alu_ceramic_1y', name: 'Keramická ochrana ALU disků až s 1 roční účinností+leštění', price: 1000 }
        ]
      },
      {
        id: 'additional_exterior',
        name: 'Další služby',
        services: [
          { id: 'windshield_wipers', name: 'Tekuté stěrače', price: 300 },
          { id: 'engine_plastic_cleaning', name: 'Čištění a oživení plastů v motorové části vozu', price: 500 },
          { id: 'headlight_renovation', name: 'Renovace předních světel + keramická ochrana až s 1 roční účinností', price: 1000 },
          { id: 'alu_partial_renovation', name: 'Částečná renovace ALU disků / broušení a lakování', price: 500, hourly: true },
          { id: 'scratch_repair', name: 'Oprava škrábanců a retuše po kamínkách / 1h', price: 350, hourly: true }
        ]
      }
    ]
  };

  const packages = {
    'Balíček - Důkladné mytí vozu': {
      services: ['foam', 'wash', 'wheels', 'door_cleaning'],
      price: 850 // Celková cena balíčku
    },
    'Balíček - Keramická ochrana interiéru': {
      services: ['leather_ceramic', 'plastics_ceramic'],
      price: 2000 // Celková cena balíčku
    }
  };

  const handleVariantChange = (groupId, value) => {
    const newSelected = new Set(selectedServices);
    if (serviceVariants[groupId]) {
      newSelected.delete(serviceVariants[groupId]);
    }

    if (value) {
      newSelected.add(value);
      setServiceVariants({...serviceVariants, [groupId]: value});
    } else {
      const newVariants = {...serviceVariants};
      delete newVariants[groupId];
      setServiceVariants(newVariants);
    }

    setSelectedServices(newSelected);
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setDiscount('');
    } else if (Number(value) >= 0 && Number(value) <= 100) {
      setDiscount(Number(value));
    }
  };

  const toggleService = (id) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      // Pokud služba má hodinovou hodnotu, smažeme její hodiny
      if (serviceHours[id]) {
        const newServiceHours = { ...serviceHours };
        delete newServiceHours[id];
        setServiceHours(newServiceHours);
      }
    } else {
      newSelected.add(id);
      const service =
        [...serviceGroups.interior.flatMap(group => group.services || group.options || []),
         ...serviceGroups.exterior.flatMap(group => group.services || group.options || [])]
          .find(service => service.id === id);

      if (service?.hourly) {
        setServiceHours({...serviceHours, [id]: 1});
      }
    }
    setSelectedServices(newSelected);
  };

  const togglePackage = (packageName) => {
    const newSelectedPackages = { ...selectedPackages };
    if (newSelectedPackages[packageName]) {
      delete newSelectedPackages[packageName];
    } else {
      newSelectedPackages[packageName] = packages[packageName].services;
    }
    setSelectedPackages(newSelectedPackages);
  };

  const updatePrices = () => {
    let sum = 0;
// Přičti ceny balíčků podle jejich celkové ceny
Object.entries(selectedPackages).forEach(([packageName]) => {
  sum += packages[packageName].price;
});
    // Projdi všechny služby a přičti jejich ceny
    Object.values(serviceGroups).forEach(category => {
      category.forEach(group => {
        if (group.type === 'select') {
          const selectedOption = group.options.find(opt => opt.id === serviceVariants[group.id]);
          if (selectedOption) {
            sum += selectedOption.price;
          }
        } else {
          group.services.forEach(service => {
            if (selectedServices.has(service.id)) {
              if (service.hourly) {
                const hours = serviceHours[service.id] || 1;
                sum += service.price * hours;
              } else {
                sum += service.price;
              }
            }
          });
        }
      });
    });

    // Přičti ceny balíčků
    Object.values(selectedPackages).forEach(packageServices => {
      packageServices.forEach(serviceId => {
        const service = [...serviceGroups.interior.flatMap(group => group.services || group.options || []),
                         ...serviceGroups.exterior.flatMap(group => group.services || group.options || [])]
                        .find(service => service.id === serviceId);
        if (service) {
          sum += service.price;
        }
      });
    });

    // Pokud je velikost vozu XL, zvyš cenu o 30%
    if (carSize === 'XL') {
      sum *= (1 + CAR_SIZE_MARKUP);
    }

    // Pokud je sleva prázdná nebo není číslo, nastav ji na 0
    const validDiscount = discount || 0;

    // Výpočet slevy a konečné ceny
    const discountAmt = (sum * validDiscount) / 100;
    const additionalChargesSum = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const final = sum - discountAmt + additionalChargesSum;

    console.log('Celková cena:', sum);
    console.log('Sleva:', discountAmt);
    console.log('Dodatečné náklady:', additionalChargesSum);
    console.log('Konečná cena:', final);

    // Nastavení cen do stavu
    setTotalPrice(sum);
    setDiscountAmount(discountAmt);
    setFinalPrice(final);
  };

  useEffect(() => {
    updatePrices();
  }, [selectedServices, serviceVariants, discount, carSize, serviceHours, additionalCharges, selectedPackages]);

  const renderServiceGroup = (group) => {
    if (group.type === 'select') {
      return (
        <div key={group.id} className="space-y-2">
          <details open>
            <summary className="font-medium text-gray-700 cursor-pointer">
              {group.name}
            </summary>
            <div className="ml-4">
              <select
                value={serviceVariants[group.id] || ''}
                onChange={(e) => handleVariantChange(group.id, e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">Nevybráno</option>
                {group.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name} - {option.price} Kč
                  </option>
                ))}
              </select>
            </div>
          </details>
        </div>
      );
    }

    return (
      <div key={group.id} className="space-y-2">
        <details open>
          <summary className="font-medium text-gray-700 cursor-pointer">
            {group.name}
          </summary>
          <div className="ml-4 space-y-2">
            {group.services.map(service => (
              <div
                key={service.id}
                className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => toggleService(service.id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedServices.has(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="h-5 w-5 rounded border-gray-300 pointer-events-none"
                  />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap justify-end">
                  <span className="font-bold text-blue-600 mr-2">{service.price} Kč</span>
                  {service.hourly && (
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        value={serviceHours[service.id] || ''}
                        onChange={(e) => setServiceHours({
                          ...serviceHours,
                          [service.id]: Number(e.target.value)
                        })}
                        className="w-8 p-1 border rounded"
                        min="0.1"
                        step="0.1"
                      />
                      <span className="ml-1">h</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  };

  const handleAdditionalChargeChange = (index, field, value) => {
    const newCharges = [...additionalCharges];
    newCharges[index][field] = value;
    setAdditionalCharges(newCharges);
  };

  const addAdditionalCharge = () => {
    setAdditionalCharges([...additionalCharges, { description: '', amount: 0 }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-4 rounded-full">
            <Calculator size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MV Auto Detailing</h1>
            <p className="text-gray-500">Kalkulace služeb</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jméno zákazníka</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Jan Novák"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="+420 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Poznámky k vozidlu</label>
              <textarea
                value={vehicleNotes}
                onChange={(e) => setVehicleNotes(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Specifické poznámky nebo požadavky..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Velikost vozu</label>
                <select
                  value={carSize}
                  onChange={(e) => setCarSize(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="M">M - Střední vozy</option>
                  <option value="XL">XL - SUV/Dodávky</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Interiér</h3>
                <div className="space-y-6">
                  {serviceGroups.interior.map(group => renderServiceGroup(group))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Exteriér</h3>
                <div className="space-y-6">
                  {serviceGroups.exterior.map(group => renderServiceGroup(group))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
    <CardContent className="pt-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Balíčky služeb</h3>
        {Object.entries(packages).map(([packageName, packageDetails]) => (
          <div 
            key={packageName} 
            className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
            onClick={() => togglePackage(packageName)}
          >
            <input
              type="checkbox"
              checked={!!selectedPackages[packageName]}
              onChange={() => togglePackage(packageName)}
              className="h-5 w-5 rounded border-gray-300 pointer-events-none"
            />
            <div className="flex justify-between w-full">
              <span className="font-medium">{packageName}</span>
              <span className="text-blue-600 font-bold">{packageDetails.price.toLocaleString()} Kč</span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Dodatečné náklady</h3>
            {additionalCharges.map((charge, index) => (
              <div key={index} className="flex items-center space-x-4">
                <input
                  type="text"
                  value={charge.description}
                  onChange={(e) => handleAdditionalChargeChange(index, 'description', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Popis dodatečného nákladu"
                />
                <input
                  type="number"
                  value={charge.amount}
                  onChange={(e) => handleAdditionalChargeChange(index, 'amount', Number(e.target.value))}
                  className="w-24 p-2 border rounded"
                  placeholder="Částka Kč"
                />
              </div>
            ))}
            <button
              onClick={addAdditionalCharge}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Přidat další náklad
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Celkem bez slevy:</span>
              <span className="font-bold">{Math.round(totalPrice).toLocaleString()} Kč</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <div className="flex items-center gap-2">
                <span>Sleva:</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={handleDiscountChange}
                  className="w-16 p-1 border rounded"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
              <span>{discountAmount > 0 ? `-${Math.round(discountAmount).toLocaleString()} Kč` : ''}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-xl">
                <span className="font-bold">Konečná cena k zaplacení:</span>
                <span className="font-bold text-blue-600">
                  {finalPrice ? `${Math.round(finalPrice).toLocaleString()} Kč` : 'Není k dispozici'}
                </span>
              </div>

              {carSize === 'XL' && (
                <div className="text-sm text-gray-500 mt-2">
                  * Cena zahrnuje navýšení o 30% pro velikost vozu XL.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Další poznámky</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Další poznámky k faktuře..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <PDFGenerator
        customerName={customerName}
        customerPhone={customerPhone}
        vehicleNotes={vehicleNotes}
        serviceGroups={serviceGroups}
        selectedServices={selectedServices}
        serviceHours={serviceHours}
        totalPrice={totalPrice}
        discount={discount}
        discountAmount={discountAmount}
        carSize={carSize}
        finalPrice={finalPrice}
        additionalCharges={additionalCharges}
        additionalNotes={additionalNotes}
        selectedPackages={selectedPackages}
      />
    </div>
  );
};

export default AutoDetailingCalculator;
