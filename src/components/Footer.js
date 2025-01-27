// Footer.js
// Komponenta pro patičku, která bude zobrazena na všech stránkách
import React from 'react';

const Footer = () => {
  return (
    <footer className="max-w-4xl mx-auto mt-8 border-t border-gray-200 py-4 text-center text-sm text-gray-600">
      <p>© {new Date().getFullYear()} MV Auto Detailing Calculator</p>
      <p>
        Vytvořil{' '}
        <a 
          href="https://github.com/NaviCZ" 
          className="text-blue-600 hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ivan Vondráček
        </a>
      </p>
      <p className="text-xs">Verze 1.0.0</p>
    </footer>
  );
};

export default Footer;