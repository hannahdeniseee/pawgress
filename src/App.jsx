import { useState, useEffect } from 'react'
import { playSelectSfx } from './utils/sfx.js'
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Login from './pages/Login.jsx'
import SelectPet from './pages/SelectPet.jsx'
import PomodoroTimer from './pages/PomodoroTimer.jsx'
import PetShop from './pages/PetShop.jsx'
import PetCustomization from './pages/PetCustomization.jsx';
import Navbar from './pages/Navbar.jsx';
import Quest from "./pages/Quests.jsx";
import Profile from './pages/Profile.jsx'; 
import StudyPlanner from './pages/StudyPlanner.jsx';
import TutorialHelpButton from "./components/TutorialHelpButton";
import HelpPage from './pages/HelpPage.jsx';
import PawBackground from "./components/PawBackground";

function AppContent() {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const [dbUser, setDbUser] = useState(null);

  // Global general-select sound on every button/link that doesn't have its own SFX
  useEffect(() => {
    const handler = (e) => {
      const el = e.target.closest('button, a');
      if (el && !el.dataset.sfx) playSelectSfx();
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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

  useEffect(() => {
  if (user?.sub) {
    const savedAuthId = localStorage.getItem("auth_user_id");
    if (savedAuthId !== user.sub) {
      localStorage.setItem("user_data", JSON.stringify({ coins: 0, xp: 0, level: 1 }));
      localStorage.setItem("auth_user_id", user.sub);
      localStorage.setItem("claimed_daily_milestone", "false");
      localStorage.setItem("claimed_weekly_milestone", "false");
    }
  }
}, [user]);

  if (isLoading) return <div style={{ color: '#000000', fontFamily: 'sans-serif', padding: '2rem' }}>Loading...</div>;

  if (!isAuthenticated) {
    return <Login />;
  }

  const currentUser = dbUser || user;

  const HomePage = () => (
    <>
    <div style={{ position: 'relative', zIndex: 1, width: '100%', margin: 0, padding: 0 }}>

      {/* Pet Selection */}
      {dbUser && <SelectPet currentUser={dbUser} />}

      {/* Pomodoro Timer */}
      <PomodoroTimer user={currentUser} />

      {/* Tutorial Button (lower right) */}
      <TutorialHelpButton />
      
      {/* Study Planner */}
      <Quest currentUser={currentUser} />  
      {dbUser && <StudyPlanner onPlanCreated={() => {}} currentUser={dbUser} />}

    </div>
    </>
  );

  return (
    <Router>
      <PawBackground variant="default" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={dbUser ? <PetShop userId={dbUser.id} /> : <div style={{color: 'white', textAlign: 'center'}}>Loading...</div>} />
        <Route path="/customization" element={dbUser ? <PetCustomization userId={dbUser.id} /> : <div style={{color: 'white', textAlign: 'center'}}>Loading...</div>} />
        <Route path="/profile" element={dbUser ? <Profile currentUser={dbUser} /> : <div style={{color: 'white', textAlign: 'center'}}>Loading...</div>} />
        <Route path="/help" element={<HelpPage />} />
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

export default App;