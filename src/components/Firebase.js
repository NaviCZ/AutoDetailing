//Firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup,sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { getDatabase, ref, push, get, remove, set } from 'firebase/database';
import { serverTimestamp } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyApr3xhd5_NKm6MhxWk_t6ILUNnw1-ekcM",
  authDomain: "autodetailing-9f2fa.firebaseapp.com",
  projectId: "autodetailing-9f2fa",
  storageBucket: "autodetailing-9f2fa.appspot.com",
  messagingSenderId: "13576574328",
  appId: "1:13576574328:web:85e0e3f329e3b902e4e48d",
  measurementId: "G-J4CQKH8X68",
  databaseURL: "https://autodetailing-9f2fa-default-rtdb.europe-west1.firebasedatabase.app"
};

// Inicializace Firebase
const app = initializeApp(firebaseConfig);

// Databáze
const database = getDatabase(app);

// Získání instance autentizace
const auth = getAuth(app);

// Získání instance Firestore
const db = getFirestore(app);

// Funkce pro přihlášení uživatele
export const signInUser = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Funkce pro odhlášení uživatele
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Funkce pro ukládání záznamu do Firebase
export const saveRecordToFirebase = async (record) => {
  try {
    const recordsRef = ref(database, 'records');
    await push(recordsRef, record);
    return true;
  } catch (error) {
    console.error('Chyba při ukládání záznamu:', error);
    return false;
  }
};

// Funkce pro načtení záznamů z Firebase
export const getRecordsFromFirebase = async () => {
  try {
    const recordsRef = ref(database, 'records');
    const snapshot = await get(recordsRef);
    if (snapshot.exists()) {
      const records = [];
      snapshot.forEach((childSnapshot) => {
        records.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return records;
    }
    return [];
  } catch (error) {
    console.error('Chyba při načítání záznamů:', error);
    return [];
  }
};

// Funkce pro smazání záznamu z Firebase
export const deleteRecordFromFirebase = async (recordId) => {
  try {
    const recordRef = ref(database, `records/${recordId}`);
    await remove(recordRef);
    return true;
  } catch (error) {
    console.error('Chyba při mazání záznamu:', error);
    return false;
  }
};

// Funkce pro sledování stavu přihlášení
export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const saveProductToFirebase = async (product, userEmail) => {
  const productToSave = {
    ...product,
    updatedAt: serverTimestamp(),
    updatedBy: userEmail
  };

  try {
    const productsRef = ref(database, 'products');
    
    if (product.id) {
      const productRef = ref(database, `products/${product.id}`);
      const snapshot = await get(productRef);
      
      if (snapshot.exists()) {
        const existingData = snapshot.val();
        
        // Pokud createdBy obsahuje ID místo emailu, nastavíme tam aktuální email
        const isCreatedByUID = existingData.createdBy && existingData.createdBy.includes('Rxet4');
        
        const updatedProduct = {
          ...productToSave,
          createdBy: isCreatedByUID ? userEmail : existingData.createdBy || userEmail,
          createdAt: existingData.createdAt || serverTimestamp(),
          updatedBy: userEmail,
          updatedAt: serverTimestamp()
        };
        
        await set(productRef, updatedProduct);
        console.log('Produkt byl úspěšně aktualizován s těmito daty:', updatedProduct);
      }
    } else {
      productToSave.createdBy = userEmail;
      productToSave.createdAt = serverTimestamp();
      await push(productsRef, productToSave);
    }
    return true;
  } catch (error) {
    console.error('Chyba při ukládání produktu:', error);
    return false;
  }
};


export const getProductsFromFirebase = async () => {
  try {
    const productsRef = ref(database, 'products');
    // Přidáme options pro force refresh
    const snapshot = await get(productsRef, { forceFresh: true });
    if (snapshot.exists()) {
      const products = [];
      snapshot.forEach((childSnapshot) => {
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      console.log('Načtená data z Firebase:', products);
      return products;
    }
    return [];
  } catch (error) {
    console.error('Chyba při načítání produktů:', error);
    return [];
  }
};

export const deleteProductFromFirebase = async (productId) => {
  try {
    console.log('Pokus o smazání produktu s ID:', productId);
    const productRef = ref(database, `products/${productId}`);
    console.log('Cesta k produktu:', productRef.toString());
    await remove(productRef);
    console.log('Produkt byl úspěšně smazán z databáze!!!');
    return true;
  } catch (error) {
    console.error('Chyba při mazání produktu:', error);
    return false;
  }
};


// Exportujte auth
export { auth, db, onAuthStateChanged };
