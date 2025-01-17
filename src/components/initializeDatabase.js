import { getDatabase, ref, set } from 'firebase/database';

const generateId = () => Date.now().toString();

const initializeDatabase = async () => {
  try {
    const database = getDatabase();
    const servicesRef = ref(database, 'services');

    // Generování ID pro služby
    const serviceIds = {
      // Interiér
      vysavani: generateId(),
      tepovaniSedacek: generateId(),
      cisteniKuze: generateId(),
      impregnaceKuze: generateId(),
      
      // Exteriér
      lesteni: generateId(),
      dekontaminace: generateId(),
      mytiVozu: generateId(),
      keramickaPovlak: generateId(),
    };

    const initialData = {
      interior: {
        items: {
          [serviceIds.cisteniKuze]: {
            id: serviceIds.cisteniKuze,
            name: "Čištění kůže",
            hasVariants: true,
            variants: [
              {
                id: `variant-${serviceIds.cisteniKuze}-0`,
                name: "Čištění kůže",
                price: 1800
              },
              {
                id: `variant-${serviceIds.cisteniKuze}-1`,
                name: "Čištění kůže + impregnace",
                price: 2000
              },
              {
                id: `variant-${serviceIds.cisteniKuze}-2`,
                name: "Čištění kůže + keramická ochrana",
                price: 2250
              }
            ],
            subcategory: "Péče o sedačky"
          },
          [serviceIds.tepovaniSedacek]: {
            id: serviceIds.tepovaniSedacek,
            name: "Tepování sedaček",
            price: 1500,
            subcategory: "Péče o sedačky"
          },
          [serviceIds.vysavani]: {
            id: serviceIds.vysavani,
            name: "Důkladné vysátí celého vozu vč. zavazadlového prostoru",
            price: 300,
            subcategory: "Základní služby"
          }
        }
      },
      exterior: {
        items: {
          [serviceIds.lesteni]: {
            id: serviceIds.lesteni,
            name: "Leštění",
            hasVariants: true,
            variants: [
              {
                id: `variant-${serviceIds.lesteni}-0`,
                name: "Leštění základní: Nepoškozený lak (před aplikací keramické ochrany) nové vozidlo",
                price: 5000
              },
              {
                id: `variant-${serviceIds.lesteni}-1`,
                name: "Leštění jednokrokovou pastou odstranění 60-70% defektů laku",
                price: 7000
              },
              {
                id: `variant-${serviceIds.lesteni}-2`,
                name: "Leštění vícekrokovou pastou až 95% defektů laku",
                price: 9000
              }
            ],
            subcategory: "Leštění"
          },
          [serviceIds.dekontaminace]: {
            id: serviceIds.dekontaminace,
            name: "Dekontaminace laku",
            price: 500,
            subcategory: "Dekontaminace"
          },
          [serviceIds.mytiVozu]: {
            id: serviceIds.mytiVozu,
            name: "Ruční mytí šampónem",
            price: 400,
            subcategory: "Základní mytí"
          }
        }
      },
      package: {
        items: {
          [generateId()]: {
            id: generateId(),
            name: "Dekontaminace vozu",
            price: 3555,
            description: "",
            services: [serviceIds.dekontaminace, serviceIds.mytiVozu]
          },
          [generateId()]: {
            id: generateId(),
            name: "Kompletní péče o kůži",
            price: 3000,
            description: "Kompletní péče o kožené sedačky včetně čištění a ochrany",
            services: [serviceIds.cisteniKuze, serviceIds.impregnaceKuze]
          }
        }
      },
      subcategories: {
        exterior: ["Základní mytí", "Dekontaminace", "Leštění", "Keramická ochrana"],
        interior: ["Základní služby", "Péče o plasty", "Péče o sedačky", "Čištění a tepování"]
      }
    };

    // Uložení dat do Firebase
    await set(servicesRef, initialData);
    console.log('Data byla úspěšně nahrána do databáze');
    
    // Pro debugging - vypíše všechna vygenerovaná ID
    console.log('Vygenerovaná ID služeb:', serviceIds);
    
  } catch (error) {
    console.error('Chyba při nahrávání dat:', error);
  }
};

export default initializeDatabase;