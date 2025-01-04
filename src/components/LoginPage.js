import React, { useState } from 'react';
import { signInUser, resetPassword } from './Firebase';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInUser(email, password);
      setError('');
      setUser({ email });
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Prosím, zadejte nejdříve email');
      return;
    }

    try {
      await resetPassword(email);
      setError('');
      setResetMessage('Pokyny k obnovení hesla byly odeslány na váš email');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Přihlášení</h1>
          <div className="space-y-4">
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
            <Button 
              onClick={handleLogin} 
              className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
            >
              Přihlásit se
            </Button>
            <button
              onClick={handleResetPassword}
              className="w-full text-sm text-blue-500 hover:text-blue-700 mt-2"
            >
              Zapomněli jste heslo?
            </button>
            {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
            {resetMessage && <p className="text-green-500 mt-2 text-center">{resetMessage}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;