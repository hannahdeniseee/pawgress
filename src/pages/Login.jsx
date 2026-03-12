import { useAuth0 } from "@auth0/auth0-react";

function Login() {
  const {
    isLoading,
    error,
    loginWithRedirect: login,
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  if (isLoading) return "Loading...";

  return (
    <>
      {error && <p>Error: {error.message}</p>}

      <button onClick={signup}>Signup</button>
      <button onClick={login}>Login</button>
    </>
  );
}

export default Login;