// ******************* ASI NA NIC *****************

import React from 'react';

const PDFGenerator = ({
  customerName,
  customerPhone,
  vehicleNotes,
  serviceGroups,
  selectedServices,
  selectedVariants,
  serviceHours,
  totalPrice,
  discount,
  discountAmount,
  carSize,
  finalPrice,
  additionalCharges,
  additionalNotes,
  selectedPackages,
  carSizeMarkup,
  packages
}) => {
  const generatePDF = () => {
    // Debug logging
    console.log('Service Groups:', serviceGroups);
    console.log('Selected Services:', selectedServices);
    console.log('Interior Services:', serviceGroups?.interior?.items);

    // Pomocná funkce pro nalezení služby podle ID
    const findServiceById = (serviceId) => {
      const findInCategory = (category) => {
        console.log(`Hledám službu ${serviceId} v kategorii ${category}`, serviceGroups[category]?.items);
        const service = serviceGroups[category]?.items?.find(service => service.id === serviceId);
        if (service) {
          console.log('Nalezena služba:', service);
          // Pokud má služba varianty a je vybraná nějaká varianta
          if (service.hasVariants && service.variants) {
            const selectedVariant = service.variants.find(v => v.id === selectedVariants[serviceId]);
            if (selectedVariant) {
              return {
                ...service,
                name: selectedVariant.name,
                price: selectedVariant.price
              };
            }
          }
          return service;
        }
        return null;
      };

      return findInCategory('interior') || findInCategory('exterior');
    };

    // Funkce pro generování tabulky služeb
    const generateServiceTable = (category) => {
      console.log(`Generuji tabulku pro kategorii ${category}:`, serviceGroups[category]);
      const categoryServices = serviceGroups[category];
        
      if (!categoryServices || !categoryServices.items) {
        console.log(`Žádné služby pro kategorii ${category}`);
        return '';
      }
        
      const services = categoryServices.items
        .filter(service => {
          console.log('Kontroluji službu:', service);
          // Zobrazit jen služby, které jsou vybrané a mají cenu větší než 0
          const isSelected = selectedServices.has(service.id);
          console.log('Je služba vybraná?', isSelected);

          const serviceDetails = findServiceById(service.id);
          console.log('Detaily služby:', serviceDetails);

          if (!serviceDetails) {
            console.log('Služba nemá detaily');
            return false;
          }

          const price = serviceDetails.hourly 
            ? (serviceDetails.price * (serviceHours[service.id] || 1)) 
            : serviceDetails.price;
          
          console.log('Cena služby:', price);
          return isSelected && price > 0;
        })
        .map(service => {
          const serviceDetails = findServiceById(service.id);
          const hours = serviceDetails.hourly ? (serviceHours[service.id] || 1) : null;
          const totalServicePrice = hours ? serviceDetails.price * hours : serviceDetails.price;
          const serviceName = hours
            ? `${serviceDetails.name.replace('/ 1h', '')} (${hours} h)`
            : serviceDetails.name;
      
          return `
            <tr>
              <td>${serviceName}</td>
              <td class="price-cell" style="width: 150px; text-align: right; white-space: nowrap;">
                ${Math.round(totalServicePrice).toLocaleString()} Kč
              </td>
            </tr>
          `;
        })
        .filter(Boolean);
        
      if (services.length === 0) {
        console.log(`Žádné vybrané služby pro kategorii ${category}`);
        return '';
      }
        
      return `
        <h2>${category === 'interior' ? 'Interiér' : 'Exteriér'}</h2>
        <table>
          <thead>
            <tr>
              <th>Služba</th>
              <th style="width: 150px; text-align: right;">Cena</th>
            </tr>
          </thead>
          <tbody>
            ${services.join('')}
          </tbody>
        </table>
      `;
    };
    
    // Generování tabulek pro interiér a exteriér
    const interiorServices = generateServiceTable('interior');
    const exteriorServices = generateServiceTable('exterior');

    // Generování tabulky dodatečných nákladů
    const additionalChargesTable = additionalCharges
      .filter(charge => charge.amount > 0)
      .map((charge) => `
        <tr>
          <td>${charge.description}</td>
          <td style="white-space: nowrap;">${Math.round(charge.amount).toLocaleString()} Kč</td>
        </tr>
      `).join('');

    // Generování tabulky vybraných balíčků s rozpisem služeb
    const packagesContent = Object.entries(selectedPackages || {})
  .filter(([packageName, packageServices]) => {
    const packageDetails = packages?.[packageName] || {};
    const packagePrice = packageDetails.price || 0;
    return packagePrice > 0;
  })
  .map(([packageName, packageServices]) => {
    const packageDetails = packages?.[packageName] || {};
    const packagePrice = packageDetails.price || 0;

    const totalServicesValue = (packageDetails.services || []).reduce((sum, serviceId) => {
      const service = findServiceById(serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const discount = totalServicesValue > 0 
      ? Math.round((1 - packagePrice / totalServicesValue) * 100)
      : 0;

    const packageServicesList = (packageDetails.services || [])
      .map(serviceId => {
        const service = findServiceById(serviceId);
        if (!service) return '';
        return `
          <tr class="package-service-row">
            <td style="padding-left: 20px; font-size: 0.9em; color: #666;">• ${service.name}</td>
            <td class="price-cell" style="font-size: 0.9em; color: #666;">${service.price?.toLocaleString()} Kč</td>
          </tr>
        `;
      })
      .join('');

    const showDetails = totalServicesValue !== packagePrice;

    return `
      <tr class="package-header">
        <td colspan="2" style="background-color: #f3f4f6; border-top: 1px solid #2563eb; padding: 15px;">
          <strong style="font-size: 1em; color:rgb(0, 0, 0);">${packageName}</strong>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 0;">
          <table style="width: 100%; margin: 0; background-color: #f8f9fa;">
            <tbody>
              ${packageServicesList}
              ${showDetails ? `
                <tr class="package-summary">
                  <td style="padding-left: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <span style="color: #666;">Celková hodnota služeb:</span>
                  </td>
                  <td class="price-cell" style="padding-top: 10px; border-top: 1px solid #e5e7eb; color: #666;">
                    ${totalServicesValue.toLocaleString()} Kč
                  </td>
                </tr>
                <tr class="package-final">
                  <td style="padding-left: 20px; padding-top: 5px; padding-bottom: 15px;">
                    <strong style="color: #2563eb;">Cena balíčku se slevou ${discount}%:</strong>
                  </td>
                  <td class="price-cell" style="padding-top: 5px; padding-bottom: 15px;">
                    <strong style="color: #2563eb;">${packagePrice.toLocaleString()} Kč</strong>
                  </td>
                </tr>
              ` : `
                <tr class="package-final">
                  <td style="padding-left: 20px; padding-top: 10px; padding-bottom: 15px; border-top: 1px solid #e5e7eb;">
                    <strong style="color: #2563eb;">Cena balíčku:</strong>
                  </td>
                  <td class="price-cell" style="padding-top: 10px; padding-bottom: 15px; border-top: 1px solid #e5e7eb;">
                    <strong style="color: #2563eb;">${packagePrice.toLocaleString()} Kč</strong>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </td>
      </tr>
      <tr><td colspan="2" style="border: none; height: 20px;"></td></tr>
    `;
  }).join('');

        
    // Generování obsahu PDF
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
            max-width: 200px;
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
          .price-cell {
            text-align: center;
            width: 100px;
            white-space: nowrap;
          }
          .center-header {
            text-align: center;
          }
          .package-header {
            background-color: #f8f9fa;
          }
          .package-service-row {
            background-color: #ffffff;
            font-size: 0.95em;
          }
          .package-service-row td {
            border-top: none;
          }

          .package-header {
  background-color: #f8f9fa;
}
.package-header td {
  padding: 15px 8px;
}
.package-service-row {
  background-color: #ffffff;
  font-size: 0.95em;
}
.package-service-row td {
  border-top: none;
  color: #666;
}
.package-summary td {
  border-top: none;
  padding-top: 10px;
}
.package-final td {
  border-top: none;
  padding-bottom: 15px;
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

        ${interiorServices}
        ${exteriorServices}

        ${Object.entries(selectedPackages || {})
  .filter(([packageName]) => {
    const packageDetails = packages?.[packageName] || {};
    return packageDetails.price > 0;
  }).length > 0 ? `
  <h2>${Object.entries(selectedPackages)
    .filter(([packageName]) => packages?.[packageName]?.price > 0)
    .length === 1 ? 'Balíček' : 'Balíčky'}</h2>
  <table>
    <thead>
      <tr>
        <th>Název</th>
        <th class="center-header">Cena</th>
      </tr>
    </thead>
    <tbody>
      ${packagesContent}
    </tbody>
  </table>
` : ''}

        ${additionalCharges.some(charge => charge.amount > 0) ? `
          <h2>Dodatečné náklady</h2>
          <table>
            <thead>
              <tr>
                <th>Popis</th>
                <th class="center-header">Cena</th>
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
              <td class="price-cell">${totalPrice.toLocaleString()} Kč</td>
            </tr>
            ${discount > 0 ? `
              <tr>
                <td>Sleva (${discount}%)</td>
                <td class="price-cell">-${Math.round(discountAmount).toLocaleString()} Kč</td>
              </tr>
            ` : ''}
            ${carSize === 'XL' ? `
              <tr>
                <td>Příplatek za vůz XL (${carSizeMarkup * 100}%)</td>
                <td class="price-cell">+${Math.round(totalPrice * carSizeMarkup).toLocaleString()} Kč</td>
              </tr>
            ` : ''}
            <tr>
              <td class="final-price">Konečná cena k zaplacení</td>
              <td class="final-price price-cell">${Math.round(finalPrice).toLocaleString()} Kč</td>
            </tr>
          </tbody>
        </table>

        ${additionalNotes ? `
          <div class="highlight">
            <h2>Poznámky</h2>
            <p>${additionalNotes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          

        <div style="text-align: center; margin-top: 30px; color: #4b5563;">
          <p style="margin-bottom: 5px;">
            Děkujeme za Vaši důvěru. Těšíme se na spolupráci!
          </p>
          <p style="font-size: 0.9em;">
           Tým MV Auto Detailing<br>
            Tel: +420 731 516 268<br>
            Email: jiramares@seznam.cz
        </p>
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

  return (
    <button
      onClick={generatePDF}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Generovat fakturu
    </button>
  );
};

export default PDFGenerator;