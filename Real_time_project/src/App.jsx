import React, { useState } from 'react';
import Login from './Login';
import App2 from './Prepaiupgraded';
import './index.css';

function App() {
  // ✅ Check token on load — if token exists, skip login
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('prepai-token');
  });

  const [user, setUser] = useState(null);

  const handleLogin = ({ user: userData, token }) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // ✅ If logged in, show Prepaiupgraded (not old InterviewSession)
  if (isLoggedIn) {
    return <App2 />;
  }

  return (
    <div className="App">
      <Login onLogin={handleLogin} />
    </div>
  );
}

export default App;