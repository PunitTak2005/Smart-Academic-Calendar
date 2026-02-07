// src/components/FacultyAuth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLogin from './FacultyLogin';
import FacultyRegister from './FacultyRegister';

const FacultyAuth = () => {
  const [view, setView] = useState('login');
  const navigate = useNavigate();

  const goHome = () => navigate('/');

  const handleLogin = (userData) => {
    // Redirect to faculty dashboard after successful login
    navigate('/faculty/dashboard');
  };

  const handleRegister = (userData) => {
    // Redirect to dashboard after successful registration
    navigate('/faculty/dashboard');
  };

  return (
    <>
      {view === 'login' ? (
        <FacultyLogin
          onLogin={handleLogin}
          switchToRegister={() => setView('register')}
          goHome={goHome}
        />
      ) : (
        <FacultyRegister
          onRegister={handleRegister}
          switchToLogin={() => setView('login')}
          goHome={goHome}
        />
      )}
    </>
  );
};

export default FacultyAuth;
