// App.js
import Footer from './components/Footer';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AutoDetailingCalculator from './components/AutoDetailingCalculator';
import LoginPage from './components/LoginPage';
import Logout from './components/Logout';
import ProductManagement from './components/ProductManagement';
import { signInUser, signOutUser, onAuthStateChangedListener } from './components/Firebase';
import { FaUser, FaCalculator, FaList, FaBoxes, FaCog, FaGift } from 'react-icons/fa';
import { ServiceProvider, useServiceContext } from './components/ServiceContext';
import AdminSettings from './components/AdminSettings';
import { OrderingProvider } from './components/admin/OrderingContext';
import CategoryOrderManager from './components/admin/CategoryOrderManager';
import UpdateNotification from './components/UpdateNotification';
import VoucherGenerator from './components/VoucherGenerator';



const App = () => {
  const [user, setUser] = useState(null);
  const calculatorRef = useRef(null);

  useEffect(() => {
    console.log('Current pathname:', window.location.pathname);
  }, [window.location.pathname]);


  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((user) => {
      if (user) {
        setUser({
          email: user.email,
          displayName: user.displayName,
          uid: user.uid
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <ServiceProvider>
        <div>
          <nav className="bg-gray-100 p-2 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Link to="/" className="text-blue-600 hover:underline text-base font-semibold">
                  Domů
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-white px-2 py-1 rounded-lg shadow-sm">
                      <FaUser className="text-gray-600 mr-1" />
                      <span className="text-gray-700 text-sm">{user.email}</span>
                    </div>
                    <Link
                      to="/logout"
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors text-center text-sm"
                    >
                      Odhlásit se
                    </Link>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors text-center text-sm"
                  >
                    Přihlásit se
                  </Link>
                )}
              </div>
            </div>
          </nav>
          {user && <UpdateNotification user={user} />}

          
          <Routes>
  {/* Explicitně definovat exact pro každou cestu */}
  <Route exact path="/" element={<Home user={user} />} />
  <Route exact path="/calculator" element={
    <AutoDetailingCalculator user={user} ref={calculatorRef}key="calculator" />
  } />
  <Route exact path="/login" element={<LoginPage setUser={setUser} />} />
  <Route exact path="/logout" element={<Logout setUser={setUser} />} />
  <Route exact path="/products" element={<ProductManagement />} />
  <Route exact path="/admin" element={<AdminSettings />} />
  <Route exact path="/admin/ordering" element={<CategoryOrderManager />} />
  <Route exact path="/vouchers" element={<VoucherGenerator />} />
</Routes>
        </div>
        <Footer />
      </ServiceProvider>
    </Router>
  );
};


const Home = ({ user }) => {
  const { serviceGroups, packages, settings  } = useServiceContext();

  const generatePriceListPDF = () => {
    // Kontrola, zda máme potřebná data
    if (!serviceGroups?.interior?.items || !serviceGroups?.exterior?.items || !packages) {
      console.error('Chybí potřebná data pro generování ceníku');
      return;
    }
  
    const findServiceById = (serviceId) => {
      // Prohledání v interiéru
      const interiorService = Object.values(serviceGroups.interior?.items || {})
        .find(service => service.id === serviceId);
      if (interiorService) return interiorService;
    
      // Prohledání v exteriéru
      const exteriorService = Object.values(serviceGroups.exterior?.items || {})
        .find(service => service.id === serviceId);
      if (exteriorService) return exteriorService;
    
      return null;
    };
  
    // Generování řádků pro balíčky
    const packageRows = Object.entries(packages || {}).map(([packageName, packageDetails]) => {
      const packagePrice = (packageDetails.services || []).reduce((sum, serviceId) => {
        const service = findServiceById(serviceId);
        return sum + (service?.price || 0);
      }, 0);
      
      return `
        <tr>
          <td>${packageName}</td>
          <td class="price-cell">${packagePrice.toLocaleString()} Kč</td>
        </tr>
      `;
    }).join('');
  
    // Generování řádků pro interiérové služby
    const interiorRows = Object.values(serviceGroups.interior.items || {})
      .map(service => `
        <tr class="bg-blue-50">
          <td>${service.name}</td>
          <td class="price-cell">${service.price?.toLocaleString()} Kč${service.hourly ? ' / hod' : ''}</td>
        </tr>
      `).join('');
  
    // Generování řádků pro exteriérové služby
    const exteriorRows = Object.values(serviceGroups.exterior.items || {})
      .map(service => `
        <tr class="bg-green-50">
          <td>${service.name}</td>
          <td class="price-cell">${service.price?.toLocaleString()} Kč${service.hourly ? ' / hod' : ''}</td>
        </tr>
      `).join('');
  
    const pdfContent = `
          <!DOCTYPE html>
    <html lang="cs">
    <head>
      <title>Ceník služeb MV Auto Detailing ${settings.priceListYear}</title>
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
        .variant {
          padding-left: 20px;
          color: #666;
        }
        .package-name-cell {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .savings {
          color: rgb(112, 107, 107);
          font-weight: normal;
          font-size: 0.9em;
          margin-left: auto;
        }
        .price-column {
          width: 70px;
          text-align: right;
          white-space: nowrap;
        }
        th:last-child, td:last-child {
          width: 70px;
          text-align: left;
          white-space: nowrap;
        }
        td.variant {
          padding-left: 20px;
        }
      </style>
    </head>
    <body>
      <img src="./Logo.png" alt="Logo firmy" class="logo" />
      <h2>Ceník služeb MV Auto Detailing - <span class="year">${settings.priceListYear}</span></h2>

      <h2>Balíčky služeb</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 80%">Balíček</th>
            <th style="width: 20%; text-align: right">Cena</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(packages).map(([packageName, packageDetails]) => {
            const totalValue = (packageDetails.services || []).reduce((sum, serviceId) => {
              const service = findServiceById(serviceId);
              return sum + (service?.price || 0);
            }, 0);

            const arePricesEqual = totalValue === packageDetails.price;
            const savingsPercentage = Math.round((totalValue - packageDetails.price) / totalValue * 100);

            return `
              <tr>
                <td>
                  <div class="package-name-cell">
                    <strong>${packageName}</strong>
                    ${!arePricesEqual ? `<span class="savings">(sleva ${savingsPercentage}%)</span>` : ''}
                  </div>
                </td>
                <td style="text-align: right">${packageDetails.price?.toLocaleString()} Kč</td>
              </tr>
              ${packageDetails.services?.map(serviceId => {
                const service = findServiceById(serviceId);
                if (!service) return '';
                return `
                  <tr>
                    <td class="variant" style="background-color: #f8f9fa;">• ${service.name}</td>
                    <td style="text-align: right; background-color: #f8f9fa;">${service.price?.toLocaleString()} Kč</td>
                  </tr>
                `;
              }).join('')}
              ${!arePricesEqual ? `
                <tr>
                  <td style="text-align: right; color: rgb(112, 107, 107);"><strong>Celková hodnota služeb:</strong></td>
                  <td style="text-align: right; color: rgb(112, 107, 107);"><strong>${totalValue.toLocaleString()} Kč</strong></td>
                </tr>
              ` : ''}
              <tr><td colspan="2" style="border: none; height: 20px;"></td></tr>
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
          ${Object.values(serviceGroups?.interior?.items || []).map(service => {
            if (service.hasVariants) {
              // Pro služby s variantami
              return `
                <tr>
                  <td colspan="2"><strong>${service.name}</strong></td>
                </tr>za větší vozy:</strong> Pr
                ${service.variants.map(variant => `
                  <tr>
                    <td class="variant">- ${variant.name}</td>
                    <td>${variant.price.toLocaleString()} Kč</td>
                  </tr>
                `).join('')}
              `;
            } else {
              // Pro běžné služby
              return `
                <tr>
                  <td>${service.name}</td>
                  <td>${service.price.toLocaleString()} Kč${service.hourly ? ' / hod' : ''}</td>
                </tr>
              `;
            }
          }).join('')}
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
          ${Object.values(serviceGroups?.exterior?.items || []).map(service => {
            if (service.hasVariants) {
              // Pro služby s variantami
              return `
                <tr>
                  <td colspan="2"><strong>${service.name}</strong></td>
                </tr>
                ${service.variants.map(variant => `
                  <tr>
                    <td class="variant">- ${variant.name}</td>
                    <td>${variant.price.toLocaleString()} Kč</td>
                  </tr>
                `).join('')}
              `;
            } else {
              // Pro běžné služby
              return `
                <tr>
                  <td>${service.name}</td>
                  <td>${service.price.toLocaleString()} Kč${service.hourly ? ' / hod' : ''}</td>
                </tr>
              `;
            }
          }).join('')}
        </tbody>
      </table>
        <div style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h3 style="color: #2563eb; margin: 0 0 10px 0;">Důležité informace:</h3>
          <p style="margin: 0; color: #374151;">
            <strong>Příplatek za větší vozy:</strong> Pro SUV, dodávky a větší vozidla se účtuje příplatek ${Math.round(settings.carSizeMarkup * 100)}% k základní ceně služeb.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #4b5563;">
          <p style="margin-bottom: 5px;">
            Děkujeme za Vaši důvěru. Těšíme se na spolupráci!
          </p>
          <p style="font-size: 0.9em;">
           Tým MV Auto Detailing<br>
            Tel: +420 731 516 268<br>
            Email: jiramares@seznam.cz
          </p>

          <div style="font-size: 10px; color:rgb(178, 182, 187); margin-top: 16px;">
          Developed by  Ivan Vondráček • vondracek-ivan.github.io
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'height=500, width=800');
  printWindow.document.write(pdfContent);
  printWindow.document.close();
  printWindow.print();
};


useEffect(() => {
  console.log('Calculator component mounted');
}, []);



return (
  <div className="container mx-auto p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
      Vítejte na stránce <br />
      <span className="whitespace-nowrap">MV Auto Detailing</span>
    </h1>

    {user ? (
  <div className="mt-8 flex flex-wrap gap-4 justify-center">
    <Link
      to="/calculator"
      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center w-full sm:w-auto"
    >
      <FaCalculator className="mr-2" />
      Kalkulačka
    </Link>
    <button
      onClick={generatePriceListPDF}
      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center w-full sm:w-auto"
    >
      <FaList className="mr-2" />
      Ceník
    </button>
    {/* Nové tlačítko pro dárkové poukazy */}
    <Link
      to="/vouchers"
      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center w-full sm:w-auto"
    >
      <FaGift className="mr-2" />
      Dárkové poukazy
    </Link>
        <Link
          to="/products"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center w-full sm:w-auto"
        >
          <FaBoxes className="mr-2" />
          Správa produktů
        </Link>
        <Link
          to="/admin"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center w-full sm:w-auto"
        >
          <FaCog className="mr-2" />
          Administrace
        </Link>

        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              Pro přístup ke kalkulačce a ceníku se prosím přihlaste
            </h2>
            <p className="text-blue-700 mb-4">
              Přihlášení vám umožní:
            </p>
            <ul className="list-disc list-inside text-blue-600 space-y-2 mb-6">
              <li>Použít kalkulačku pro výpočet ceny služeb</li>
              <li>Zobrazit aktuální ceník služeb</li>
              <li>Přístup k dalším funkcím aplikace</li>
            </ul>
            <Link
              to="/login"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
            >
              <FaUser className="mr-2" />
              Přihlásit se
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
