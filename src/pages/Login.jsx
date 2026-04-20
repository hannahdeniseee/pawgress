import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "../styles/Login.css";
import logo from "../assets/logo.svg";
import PawBackground from "../components/PawBackground";

function Login(){
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login, 
    logout: auth0Logout,
    user,
  } = useAuth0();

  const [dbUser, setDbUser] = useState(null);

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

    useEffect(() => {
    if (isAuthenticated && user) {
      fetch("http://localhost:5000/api/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth0Id: user.sub,
          username: user.nickname || user.name || user.email,
          avatarUrl: user.picture || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => setDbUser(data))
        .catch((err) => console.error("Error saving user:", err));
    }
  }, [isAuthenticated, user]);

  if (isLoading) return "Loading...";

  return isAuthenticated ? (
    <div className="login-page">
      <img
        src={user.picture}
        alt={user.name}
        style={{ width: "100px", height: "100px", borderRadius: "50%", marginBottom: "15px", objectFit: "cover" }}
      />
      <h2>{user.nickname}</h2>
      <p><strong>Email:</strong> {user.email}</p>

      <button onClick={logout}>Logout</button>
      
    </div>
  ) : (
    <>
      <PawBackground variant="default" />
      {error && <p>Error: {error.message}</p>}

    <div className="login-page">
      <div className="button-container">
        <img className="logo" src={logo}></img>
        <button onClick={signup}>Signup</button>
        <button onClick={login}>Login</button>
      </div>
    </div>
    </>
  );
}

export default Login