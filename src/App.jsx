import { useState, useEffect } from 'react'
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Login from './pages/Login.jsx'
import SelectPet from './pages/SelectPet.jsx'
import PomodoroTimer from './pages/PomodoroTimer.jsx'
import PetShop from './pages/PetShop.jsx'
import Todo from "./pages/Todo.jsx";
import Social from "./pages/Social.jsx";
import PetCustomization from './pages/PetCustomization.jsx';
import Navbar from './pages/Navbar.jsx';

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

  if (!isAuthenticated) {
    return <Login />;
  }

  const currentUser = dbUser || user;

  const HomePage = () => (
    <>
      <PomodoroTimer user={currentUser} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {dbUser && <SelectPet currentUser={dbUser} />}
      </div>
      <Todo />
    </>
  );

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={dbUser ? <PetShop userId={dbUser.id} /> : <div>Loading...</div>} />
        <Route path="/customization" element={dbUser ? <PetCustomization userId={dbUser.id} /> : <div>Loading...</div>} />
        <Route path="/profile" element={dbUser ? <Social currentUser={dbUser} /> : <div>Loading...</div>} />
      </Routes>
    </Router>
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