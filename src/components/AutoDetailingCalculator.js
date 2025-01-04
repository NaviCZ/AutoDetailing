//AutoDetailingCalculator

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Printer, Download, Calculator, List, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { saveRecordToFirebase, getRecordsFromFirebase, deleteRecordFromFirebase, onAuthStateChangedListener } from './Firebase';
import { auth } from './Firebase';
import { useServiceContext } from './ServiceContext';

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
  selectedPackages,
  userEmail
}) => {
  const generatePDF = () => {
    const generateServiceTable = (category) => {
      const categoryServices = serviceGroups[category];

      if (!Array.isArray(categoryServices)) {
        // Changed the logic to handle object structure correctly
        const services = Object.values(categoryServices)
          .flatMap(group =>
            (group.services || group.options || [])
              .filter(service => selectedServices.has(service.id))
              .map(service => {
                const hours = service?.hourly ? serviceHours[service.id] || 1 : null;
                const totalServicePrice = hours ? service.price * hours : service.price;

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
          );

        return services.length > 0 ? `
          <h2>${category === 'interior' ? 'Interiér' : 'Exteriér'}</h2>
          <table>
            <thead>
              <tr>
                <th>Služba</th>
                <th>Cena</th>
              </tr>
            </thead>
            <tbody>
              ${services.join('')}
            </tbody>
          </table>
        ` : '';
      }
      return '';
    };

    const generatePackageTable = (packageName, services) => {
      const packageServices = services
        .map(serviceId => {
          const service = [...Object.values(serviceGroups.interior).flatMap(group => group.services || group.options || []),
                           ...Object.values(serviceGroups.exterior).flatMap(group => group.services || group.options || [])]
                          .find(service => service.id === serviceId);

          if (!service) return '';

          const hours = service?.hourly ? serviceHours[service.id] || 1 : null;
          const totalServicePrice = hours ? service.price * hours : service.price;

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

      return packageServices ? `
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
      ` : '';
    };

    const interiorServices = generateServiceTable('interior');
    const exteriorServices = generateServiceTable('exterior');

    const additionalChargesTable = additionalCharges
      .filter(charge => charge.amount > 0)
      .map((charge) => `
        <tr>
          <td>${charge.description}</td>
          <td style="white-space: nowrap;">${Math.round(charge.amount).toLocaleString()} Kč</td>
        </tr>
      `).join('');

    const packageTables = Object.entries(selectedPackages)
      .map(([packageName, services]) => generatePackageTable(packageName, services))
      .join('');

    // Generate PDF content
    const pdfContent = `
      <!DOCTYPE html>
      <html lang="cs">
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

        ${packageTables}
        ${interiorServices}
        ${exteriorServices}

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
            <tr>
              <td class="final-price">Konečná cena k zaplacení</td>
              <td class="final-price">${Math.round(finalPrice).toLocaleString()} Kč</td>
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

const SavedRecordsModal = ({ onClose, onLoadRecord }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      const fetchedRecords = await getRecordsFromFirebase();
      setRecords(fetchedRecords);
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
      <div className="bg-white p-8 rounded-lg max-w-4xl max-w-full w-[600px] max-h-[90vh] overflow-y-auto">
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
                  <p className="text-gray-700">{record.vehicleNotes}</p>
                  <p className="text-gray-700">Uložil: {record.userEmail}</p> {/* Přidáno uživatelské e-mail */}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onLoadRecord(record)}
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

const GitHubUpdates = ({ repoOwner, repoName }) => {
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=3`);
        const data = await response.json();
        setCommits(data);
      } catch (error) {
        console.error('Chyba při načítání commitů:', error);
      }
    };

    fetchCommits();
  }, [repoOwner, repoName]);

  const splitCommitMessage = (message) => {
    // Předpokládáme, že název souboru je první slovo a zbytek je komentář
    const parts = message.split(' ');
    const fileName = parts.shift(); // Odebere první prvek (název souboru)
    const comment = parts.join(' '); // Zbytek je komentář
    return { fileName, comment };
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded shadow">
      <h2 className="text-sm font-bold">Poslední aktualizace</h2>
      {commits.length > 0 ? (
        <ul className="space-y-2">
          {commits.map(commit => {
            const { fileName, comment } = splitCommitMessage(commit.commit.message);
            const date = new Date(commit.commit.author.date).toLocaleString();
            const author = commit.commit.author.name;
            return (
              <li key={commit.sha} className="border p-2 rounded bg-white shadow-sm">
                <p className="text-xs font-semibold">{fileName}</p>
                <p className="text-xs text-gray-500 mt-1">{comment}</p>
                <p className="text-xs text-gray-500 mt-1">{author} • {date}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm">Žádné aktualizace k zobrazení.</p>
      )}
    </div>
  );
};

const AutoDetailingCalculator = () => {
  const { serviceGroups, packages } = useServiceContext();
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
  const [showPriceList, setShowPriceList] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [showSavedRecords, setShowSavedRecords] = useState(false);

  const handleVariantChange = (groupId, value) => {
    const newSelected = new Set(selectedServices);
    if (serviceVariants[groupId]) {
      newSelected.delete(serviceVariants[groupId]);
    }

    if (value) {
      newSelected.add(value);
      setServiceVariants({ ...serviceVariants, [groupId]: value });
    } else {
      const newVariants = { ...serviceVariants };
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
        [...Object.values(serviceGroups.interior).flatMap(group => group.services || group.options || []),
         ...Object.values(serviceGroups.exterior).flatMap(group => group.services || group.options || [])]
          .find(service => service.id === id);

      if (service?.hourly) {
        setServiceHours({ ...serviceHours, [id]: 1 });
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

    // Projdi všechny služby a přičti jejich ceny
    Object.values(serviceGroups).forEach(category => {
      Object.values(category).forEach(group => {
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

    // Přičti ceny balíčků podle jejich skutečné ceny
    Object.entries(selectedPackages).forEach(([packageName, serviceIds]) => {
      serviceIds.forEach(serviceId => {
        const service = [...Object.values(serviceGroups.interior).flatMap(group => group.services || group.options || []),
                         ...Object.values(serviceGroups.exterior).flatMap(group => group.services || group.options || [])]
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

    // Nastavení cen do stavu
    setTotalPrice(sum);
    setDiscountAmount(discountAmt);
    setFinalPrice(final);
  };

  useEffect(() => {
    updatePrices();
  }, [selectedServices, serviceVariants, discount, carSize, serviceHours, additionalCharges, selectedPackages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      if (currentUser) {
        setUserEmail(currentUser.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderServiceGroup = (category, group) => {
    if (!group) return null; // Add null check for group
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
                {(group.options || []).map((option, index) => (
                  <option key={`${option.id}-${index}`} value={option.id}>
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
            {(group.services || []).map((service, index) => (
              <div
                key={`${service.id}-${index}`}
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

    // If it's the amount field, ensure it's a positive number
    if (field === 'amount') {
      let numValue = '';
      if (value !== '' && value !== null && value !== undefined) {
        // Přidejte kontrolu, zda je value řetězec
        const stringValue = String(value);
        numValue = Number(stringValue.replace(/^0+/, '').replace(/[^0-9.]/g, ''));
        numValue = numValue > 0 ? numValue : '';
      }
      newCharges[index][field] = numValue;
    } else {
      newCharges[index][field] = value;
    }

    setAdditionalCharges(newCharges);
  };

  const addAdditionalCharge = () => {
    setAdditionalCharges([...additionalCharges, { description: '', amount: 0 }]);
  };

  const saveRecord = async () => {
    const recordToSave = {
      customerName,
      customerPhone,
      vehicleNotes,
      selectedServices: Array.from(selectedServices),
      serviceVariants,
      carSize,
      totalPrice,
      discount,
      finalPrice,
      additionalCharges,
      additionalNotes,
      selectedPackages,
      timestamp: new Date().toISOString(),
      userEmail: userEmail // Použijeme hodnotu ze stavu userEmail
    };

    const success = await saveRecordToFirebase(recordToSave);
    if (success) {
      alert('Záznam byl úspěšně uložen');
    } else {
      alert('Při ukládání záznamu došlo k chybě');
    }
  };

  const loadRecord = (record) => {
    console.log('Loading Record:', record);
    setCustomerName(record.customerName);
    setCustomerPhone(record.customerPhone);
    setVehicleNotes(record.vehicleNotes);
    setSelectedServices(new Set(record.selectedServices));
    setServiceVariants(record.serviceVariants || {}); // Ensure serviceVariants is an object
    setCarSize(record.carSize);
    setDiscount(record.discount);
    setAdditionalCharges(record.additionalCharges);
    setAdditionalNotes(record.additionalNotes);
    setSelectedPackages(record.selectedPackages || {}); // Ensure selectedPackages is an object
    setUserEmail(record.userEmail); // Nastavení uživatelského e-mailu
    setShowSavedRecords(false);
  };

  const generatePriceListPDF = () => {
    const pdfContent = `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <title>Ceník služeb MV Auto Detailing 2024</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .logo {
            max-width: 200px;
            display: block;
            margin: 0 auto 20px;
          }
          h1, h2 {
            text-align: center;
            color: #333;
            border-bottom: 2px solid #4a90e2;
            padding-bottom: 10px;
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
          .year {
            font-weight: bold;
            font-size: 1.2em;
          }
        </style>
      </head>
      <body>
        <img src="./Logo.png" alt="Logo firmy" class="logo" />
        <h1>Ceník služeb MV Auto Detailing - <span class="year">2024</span></h1>

        <h2>Balíčky služeb</h2>
        <table>
          <thead>
            <tr>
              <th>Balíček</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(packages).map(([packageName, packageDetails]) => {
              const packagePrice = packageDetails.services.reduce((sum, serviceId) => {
                const service = [...Object.values(serviceGroups.interior).flatMap(group => group.services || group.options || []),
                                ...Object.values(serviceGroups.exterior).flatMap(group => group.services || group.options || [])]
                               .find(service => service.id === serviceId);
                return sum + (service ? service.price : 0);
              }, 0);
              return `
                <tr>
                  <td>${packageName}</td>
                  <td>${packagePrice.toLocaleString()} Kč</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h2>Interiér</h2>
        <table>
          <thead>
            <tr>
              <th>Služba</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(serviceGroups.interior)
              .flatMap(group => group.services || group.options || [])
              .map(service => `
                <tr>
                  <td>${service.name}</td>
                  <td>${service.price.toLocaleString()} Kč${service.hourly ? ' / hod' : ''}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>

        <h2>Exteriér</h2>
        <table>
          <thead>
            <tr>
              <th>Služba</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(serviceGroups.exterior)
              .flatMap(group => group.services || group.options || [])
              .map(service => `
                <tr>
                  <td>${service.name}</td>
                  <td>${service.price.toLocaleString()} Kč${service.hourly ? ' / hod' : ''}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=500, width=800');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-between space-x-2 flex-wrap">
          <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
            <div className="bg-blue-600 text-white p-4 rounded-full">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MV Auto Detailing</h1>
              <p className="text-gray-500">Kalkulace služeb</p>
            </div>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto justify-end">
            
            <Button
              variant="outline"
              onClick={() => setShowSavedRecords(true)}
              className="h-12 px-4 mb-2 sm:mb-0 w-full sm:w-auto flex-grow flex items-center justify-center"
            >
              <List className="mr-2" /> Uložené záznamy
            </Button>

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
              <details open>
                <summary className="text-lg font-bold mb-4 cursor-pointer">
                  Interiér
                </summary>
                <div className="space-y-6 ml-4">
                  {Object.entries(serviceGroups.interior).map(([subcategory, group]) => renderServiceGroup('interior', group))}
                </div>
              </details>

              <details open>
                <summary className="text-lg font-bold mb-4 cursor-pointer">
                  Exteriér
                </summary>
                <div className="space-y-6 ml-4">
                  {Object.entries(serviceGroups.exterior || {}).map(([subcategory, group]) =>
                    renderServiceGroup('exterior', group)
                  )}
                </div>
              </details>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Balíčky služeb</h3>
            {Object.entries(packages).map(([packageName, packageDetails], index) => {
              const packagePrice = packageDetails.services.reduce((sum, serviceId) => {
                const service = [...Object.values(serviceGroups.interior).flatMap(group => group.services || group.options || []),
                                ...Object.values(serviceGroups.exterior).flatMap(group => group.services || group.options || [])]
                               .find(service => service.id === serviceId);
                return sum + (service ? service.price : 0);
              }, 0);

              return (
                <div
                  key={`${packageName}-${index}`}
                  className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
                  onClick={() => togglePackage(packageName)}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedPackages[packageName]}
                    onChange={() => togglePackage(packageName)}
                    className="h-5 w-5 rounded border-gray-300 pointer-events-none"
                  />
                  <div className="flex justify-between w-full items-center">
                    <span className="font-medium whitespace-nowrap">{packageName}</span>
                    <span className="text-blue-600 font-bold whitespace-nowrap ml-4">{packagePrice.toLocaleString()} Kč</span>
                  </div>
                </div>
              );
            })}
          </div>

        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Dodatečné náklady</h3>
            {additionalCharges.map((charge, index) => (
              <div key={`charge-${index}`} className="flex items-center space-x-4">
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
                  placeholder="Kč"
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
            <label className="text-sm font-medium">Poznámky:</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Poznámka která bude na faktuře..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between space-x-2 mt-4 mb-4 mx-4">
        <button
          onClick={saveRecord}
          className="bg-blue-500 text-white px-4 py-2 rounded flex-grow"
        >
          Uložit záznam
        </button>
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
          userEmail={userEmail} // Přidáno uživatelské e-mail
        />
      </div>

      <GitHubUpdates repoOwner="NaviCZ" repoName="AutoDetailing" />

      {showSavedRecords && (
        <SavedRecordsModal
          records={JSON.parse(localStorage.getItem('autoDetailingRecords') || '[]')}
          onClose={() => setShowSavedRecords(false)}
          onLoadRecord={loadRecord}
        />
      )}
    </>
  );
};

export default AutoDetailingCalculator;
