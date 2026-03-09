import { useAuth0 } from "@auth0/auth0-react";

function Login() {
  const {
    isLoading,
    error,
    loginWithRedirect: login,
  } = useAuth0();

  const [dbUser, setDbUser] = useState(null);

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

<<<<<<< HEAD
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

=======
>>>>>>> 401a4bc809c7d1b9548403dd3c6b378d363ea3ab
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