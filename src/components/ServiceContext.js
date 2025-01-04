import React, { createContext, useContext, useState, useEffect } from 'react';

const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
  const [serviceGroups, setServiceGroups] = useState({});
  const [packages, setPackages] = useState({});

  useEffect(() => {
    // Simulujeme načtení dat
    setServiceGroups({
      interior: {
        basic: {
          name: 'Základní služby',
          services: [
            { id: 'vac', name: 'Důkladné vysátí celého vozu vč. zavazadlového prostoru', price: 300 },
            { id: 'mats', name: 'Mytí gumových koberečků + prémiová impregnace', price: 150 },
            { id: 'perfume', name: 'Provonění interiéru', price: 50 }
          ]
        },
        plastics: {
          name: 'Péče o plasty',
          services: [
            { id: 'plastics_basic', name: 'Čistění všech plastů v interiéru (madla dveří, řadící páka, pedály, výdechů, kolejniček atd.)', price: 500 },
            { id: 'plastics_premium', name: 'Prémiová impregnace a konzervace plastů', price: 500 }
          ]
        },
        cleaning: {
          name: 'Čištění a tepování',
          services: [
            { id: 'carpet_mats', name: 'Tepování texilních koberečků', price: 200 },
            { id: 'carpets', name: 'Tepování podlahových koberců', price: 700 }
          ]
        },
        seats: {
          name: 'Péče o sedačky',
          type: 'select',
          options: [
            { id: 'seats_textile', name: 'Tepování textilních sedaček', price: 1800 },
            { id: 'seats_textile_sealant', name: 'Textile Sealant - impregnace textilu', price: 1100 },
            { id: 'seats_leather', name: 'Důkladné a šetrné čištění kůže + výživa s impregnací', price: 1600 },
            { id: 'leather_ceramic', name: 'Důkladné a šetrné čištění kůže + keramická ochrana kůže', price: 2700 },
            { id: 'leather_ceramic', name: 'Keramická ochrana kůže', price: 1600 }
          ]
        },
        additional: {
          name: 'Další služby',
          services: [
            { id: 'seal_impregnation', name: 'Impregnace těsnění dveří', price: 200 },
            { id: 'ceiling_cleaning', name: 'Čištění stropnice', price: 500 },
            { id: 'pet_hair_removal', name: 'Odstranění zvířecích chlupů', price: 300 },
            { id: 'seatbelt_cleaning', name: 'Čištění bezpečnostních pásů', price: 300 },
            { id: 'ac_cleaning', name: 'Čištění klimatizace a interiéru ozónem', price: 300 },
            { id: 'steam_cleaning', name: 'Parní hloubkové čištění / 1h', price: 350, hourly: true },
            { id: 'leather_renovation', name: 'Renovace kůže autosedaček 2ks', price: 1000 },
            { id: 'plastics_ceramic', name: 'Keramika na plasty v interiéru', price: 800 }
          ]
        }
      },
      exterior: {
        basic_exterior: {
          name: 'Základní mytí',
          services: [
            { id: 'foam', name: 'Předmytí aktivní pěnou', price: 100 },
            { id: 'wash', name: 'Ruční mytí šampónem', price: 400 },
            { id: 'wheels', name: 'Důkladné mytí kol a pneumatik', price: 100 },
            { id: 'door_cleaning', name: 'Mytí a hloubkové čištění mezidveřních prostor včetně ochrany', price: 250 }
          ]
        },
        decontamination: {
          name: 'Dekontaminace',
          services: [
            { id: 'clay_mechanical', name: 'Mechanická dekontaminace CLAY', price: 900 },
            { id: 'chemical_body', name: 'Chemická dekontaminace laku karoserie - PH neutral', price: 500 },
            { id: 'chemical_wheels', name: 'Chemická dekontaminace 4 kol - PH neutral', price: 250 }
          ]
        },
        windows: {
          name: 'Ošetření oken',
          services: [
            { id: 'window_polish', name: 'Vyleštění všech oken z obou stran', price: 300 },
            { id: 'glass_ceramic_1y', name: 'Keramická ochrana všech skel až s 1 roční účinností', price: 700 }
          ]
        },
        waxing: {
          name: 'Vosk',
          type: 'select',
          options: [
            { id: 'hard_wax', name: 'Tuhý vosk', price: 1600 },
            { id: 'quick_wax', name: 'Rychlovosk', price: 600 }
          ]
        },
        polish: {
          name: 'Leštění',
          type: 'select',
          options: [
            { id: 'polish_basic', name: 'Leštění základní: Nepoškozený lak (před aplikací keramické ochrany) nové vozidlo, před aplikací keramické ochrany', price: 5000 },
            { id: 'polish_one_step', name: 'Leštění jednokrokovou pastou odstranění 60-70% defektů laku', price: 7000 },
            { id: 'polish_multi_step', name: 'Leštění vícekrokovou pastou až 95% defektů laku', price: 9000 }
          ]
        },
        ceramic_protection: {
          name: 'Keramická ochrana laku',
          type: 'select',
          options: [
            { id: 'ceramic_1y', name: 'Keramická ochrana laku s 1 roční účinností', price: 4000 },
            { id: 'ceramic_2y', name: 'Keramická ochrana laku až s 2 roční účinností', price: 7000 },
            { id: 'ceramic_3y', name: 'Keramická ochrana laku až s 3 roční účinností', price: 9000 },
            { id: 'ceramic_5y', name: 'Keramická ochrana laku až s 5 roční účinností / dvě vrstvy', price: 12000 }
          ]
        },
        ceramic_extras: {
          name: 'Keramická ochrana exteriérových plastů a světel ',
          type: 'select',
          options: [
            { id: 'plastics_ceramic_1y', name: 'Keramická ochrana exteriérových plastů a světel až s 1 roční účinností', price: 1500 },
            { id: 'plastics_ceramic_2y', name: 'Keramická ochrana exteriérových plastů a světel až s 2 roční účinností', price: 1800 },
            { id: 'plastics_ceramic_3y', name: 'Keramická ochrana exteriérových plastů a světel až s 3 roční účinností', price: 2100 },
            { id: 'plastics_ceramic_5y', name: 'Keramická ochrana exteriérových plastů a světel až s 5 roční účinností', price: 2500 }
          ]
        },
        additional_protection: {
          name: 'Další ochrany',
          services: [
            { id: 'plastic_tire_impregnation', name: 'Impregnace venkovních plastů a pneu', price: 300 },
            { id: 'alu_ceramic_1y', name: 'Keramická ochrana ALU disků až s 1 roční účinností+leštění', price: 1000 }
          ]
        },
        additional_exterior: {
          name: 'Další služby',
          services: [
            { id: 'windshield_wipers', name: 'Tekuté stěrače', price: 300 },
            { id: 'engine_plastic_cleaning', name: 'Hloubkové čištění mot. prostoru včetně vnitřní strady kapoty + ošetření mot. plastů', price: 700 },
            { id: 'headlight_renovation', name: 'Renovace předních světel + keramická ochrana až s 1 roční účinností', price: 1000 },
            { id: 'alu_partial_renovation', name: 'Částečná renovace ALU disků / broušení a lakování', price: 500, hourly: true },
            { id: 'scratch_repair', name: 'Oprava škrábanců a retuše po kamínkách / 1h', price: 350, hourly: true }
          ]
        }
      }
    });

    setPackages({
      'Balíček - Důkladné mytí vozu': {
        services: ['foam', 'wash', 'wheels', 'door_cleaning', 'chemical_body', 'chemical_wheels'],
      },
      'Balíček - Keramická ochrana interiéru': {
        services: ['leather_ceramic', 'plastics_ceramic'],
      }
    });
  }, []);

  return (
    <ServiceContext.Provider value={{ serviceGroups, packages }}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServiceContext = () => {
  return useContext(ServiceContext);
};
