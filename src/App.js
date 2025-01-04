// App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AutoDetailingCalculator from './components/AutoDetailingCalculator';
import LoginPage from './components/LoginPage';
import Logout from './components/Logout';
import ProductManagement from './components/ProductManagement';
import { signInUser, signOutUser, onAuthStateChangedListener } from './components/Firebase';
import { FaUser, FaCalculator, FaList, FaBoxes } from 'react-icons/fa';
import { ServiceProvider, useServiceContext } from './components/ServiceContext';

const App = () => {
  const [user, setUser] = useState(null);
  const calculatorRef = useRef(null);

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
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/calculator" element={<AutoDetailingCalculator user={user} ref={calculatorRef} />} />
            <Route path="/login" element={<LoginPage setUser={setUser} />} />
            <Route path="/logout" element={<Logout setUser={setUser} />} />
            <Route path="/products" element={<ProductManagement />} />
          </Routes>
        </div>
      </ServiceProvider>
    </Router>
  );
};


const Home = ({ user }) => {
  const { serviceGroups, packages } = useServiceContext(); // Změna zde - použijeme pouze serviceGroups a packages

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
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Vítejte na stránce MV Auto Detailing
      </h1>
      
      {user ? (
        <div className="mt-8 flex space-x-4">
          <Link
            to="/calculator"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            <FaCalculator className="mr-2" />
            Kalkulačka
          </Link>
          <button
            onClick={generatePriceListPDF}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            <FaList className="mr-2" />
            Ceník
          </button>
          <Link
            to="/products"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            <FaBoxes className="mr-2" />
            Správa produktů
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
