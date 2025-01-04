import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from './Firebase';

const Logout = ({ setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOutUser();
        setUser(null);
        navigate('/'); // Přesměrujeme na hlavní stránku po odhlášení
      } catch (error) {
        console.error(error.message);
      }
    };

    handleLogout();
  }, [navigate, setUser]);

  return null;
};

export default Logout;
