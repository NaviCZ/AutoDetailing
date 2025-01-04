import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInUser } from './Firebase';

const LoginComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await signInUser(email, password);
      setSuccess(true);
      console.log("Přihlášení úspěšné");
      navigate('/'); // Po úspěšném přihlášení přesměrujeme uživatele na hlavní stránku
    } catch (error) {
      console.error("Chyba při přihlášení:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Přihlášení</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Přihlášení úspěšné!</p>}
      {loading && <p>Přihlašuji...</p>}
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Heslo"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Přihlašuji...' : 'Přihlásit se'}
      </button>
    </div>
  );
};

export default LoginComponent;
