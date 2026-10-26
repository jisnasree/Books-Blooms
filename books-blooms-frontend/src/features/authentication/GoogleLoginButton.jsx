
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { AUTH_BASE_URL, HOME_URL, ADMIN_URL } from "../../constants";
import { UserContext } from "../../context/UserContext";

function GoogleLoginButton() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");

    if (!credentialResponse.credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_BASE_URL}google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Google login failed. Please try again.");
        return;
      }

      sessionStorage.setItem("authToken", data.token);
      setUser(data);

      if (data.isAdmin) {
        navigate(ADMIN_URL);
      } else {
        navigate(HOME_URL);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {loading && (
        <p className="text-sm text-gray-600">Signing in with Google...</p>
      )}

      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setError("Google sign-in failed. Please try again.")}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default GoogleLoginButton;
