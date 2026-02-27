import { useState } from 'react'
import './App.css'
import Login from './pages/Login.jsx'
import { Auth0Provider } from "@auth0/auth0-react";

function App() {

  return (
    <Auth0Provider
      domain="dev-wjz8z2uilzuyk5oo.us.auth0.com"
      clientId="QIgrYpD60YGVmrc6o9uKoyyvRFFoj78O"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <Login/>
    </Auth0Provider>
  );
}

export default App
