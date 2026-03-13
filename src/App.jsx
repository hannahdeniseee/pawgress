import { useState, useEffect } from 'react'
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import Login from './pages/Login.jsx'
import SelectPet from './pages/SelectPet.jsx'
import PomodoroTimer from './pages/PomodoroTimer.jsx'
import Profile from './pages/Profile.jsx'

function AppContent() {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetch("http://localhost:5000/api/users/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0Id: user.sub,
          username: user.nickname || user.name || user.email,
          avatarUrl: user.picture || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => setDbUser(data))
        .catch((err) => console.error("Error saving user to DB:", err));
    }
  }, [isAuthenticated, user]);

  if (isLoading) return <div style={{ color: '#f0ebe6', fontFamily: 'sans-serif', padding: '2rem' }}>Loading...</div>;

  return isAuthenticated ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Profile dbUser={dbUser} />
      <PomodoroTimer user={dbUser || user} />
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <SelectPet />
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Arial', color: '#666' }}>Login to save your progress</p>
        <Login />
      </div>
    </div>
  );
}

function App() {
  return (
    <Auth0Provider
      domain="dev-wjz8z2uilzuyk5oo.us.auth0.com"
      clientId="QIgrYpD60YGVmrc6o9uKoyyvRFFoj78O"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <AppContent />
    </Auth0Provider>
  );
}

export default App