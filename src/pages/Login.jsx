import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Todo from "./Todo.jsx"; 

function Login(){
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login, 
    logout: auth0Logout,
    user,
  } = useAuth0();

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
          auth0_id: user.sub,
          username: user.nickname || user.name || user.email,
          avatar_url: user.picture || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("User saved to DB:", data);
        })
        .catch((err) => {
          console.error("Error saving user to DB:", err);
        });
    }
  }, [isAuthenticated, user]);

  if (isLoading) return "Loading...";

  return isAuthenticated ? (
    <>
      <img
        src={user.picture}
        alt={user.name}
        style={{ width: "100px", height: "100px", borderRadius: "50%", marginBottom: "15px", objectFit: "cover" }}
      />
      <h2>{user.nickname}</h2>
      <p><strong>Email:</strong> {user.email}</p>

      <button onClick={logout}>Logout</button>
       <Todo />
    </>
  ) : (
    <>
      {error && <p>Error: {error.message}</p>}

      <button onClick={signup}>Signup</button>

      <button onClick={login}>Login</button>
    </>
  );
}

export default Login