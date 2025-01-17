import React, { useState } from 'react';
import { signInUser, resetPassword } from './Firebase';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setUser }) => {
  const [email, setEmail] = useState(''); // Stav pro uchování emailu
  const [password, setPassword] = useState(''); // Stav pro uchování hesla
  const [error, setError] = useState(''); // Stav pro zobrazení chybové zprávy
  const [resetMessage, setResetMessage] = useState(''); // Stav pro zobrazení zprávy o resetování hesla
  const navigate = useNavigate(); // Hook pro navigaci mezi stránkami

  // Funkce pro přihlášení uživatele
  const handleLogin = async () => {
    try {
      await signInUser(email, password); // Volání Firebase funkce pro přihlášení
      setError(''); // Vymazání chybové zprávy při úspěšném přihlášení
      setUser({ email }); // Nastavení uživatele do globálního stavu
      navigate('/'); // Přesměrování na hlavní stránku
    } catch (error) {
      setError(error.message); // Zobrazení chybové zprávy při neúspěšném přihlášení
    }
  };

  // Funkce pro resetování hesla
  const handleResetPassword = async () => {
    if (!email) {
      setError('Prosím, zadejte nejdříve email'); // Validace, zda je vyplněn email
      return;
    }

    try {
      await resetPassword(email); // Volání Firebase funkce pro resetování hesla
      setError(''); // Vymazání chybové zprávy při úspěšném resetování
      setResetMessage('Pokyny k obnovení hesla byly odeslány na váš email'); // Zobrazení úspěšné zprávy
    } catch (error) {
      setError(error.message); // Zobrazení chybové zprávy při neúspěšném resetování
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Přihlášení</h1>
          <div className="space-y-4">
            {/* Input pro email */}
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="Email"
              />
            </div>
            {/* Input pro heslo */}
            <div>
              <label className="text-sm font-medium block mb-1">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="Heslo"
              />
            </div>
            {/* Tlačítko pro přihlášení */}
            <Button 
              onClick={handleLogin} 
              className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
            >
              Přihlásit se
            </Button>
            {/* Odkaz pro resetování hesla */}
            <button
              onClick={handleResetPassword}
              className="w-full text-sm text-blue-500 hover:text-blue-700 mt-2"
            >
              Zapomněli jste heslo?
            </button>
            {/* Zobrazení chybové zprávy */}
            {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
            {/* Zobrazení zprávy o resetování hesla */}
            {resetMessage && <p className="text-green-500 mt-2 text-center">{resetMessage}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;