import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";



export function useCurrentUser() {
  const loginUser = useUser();
  const [user, setUser] = useState(() => loginUser?.user || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loginUser?.user) {
      setUser(loginUser.user);
      setLoading(false);
    }
  }, [loginUser?.user]);

  return { user: user || loginUser?.user, loading, error };
}