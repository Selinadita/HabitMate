import { useEffect, useState } from "react";
import api from "./lib/api";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [active, setActive] = useState("Dashboard"),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("habitmate_token");
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("habitmate_token"))
      .finally(() => setChecking(false));
  }, []);
  function logout() {
    localStorage.removeItem("habitmate_token");
    setUser(null);
  }
  if (checking)
    return (
      <div className="min-h-screen grid place-items-center text-[#8067d8]">
        Loading HabitMate…
      </div>
    );
  if (!user) return <Auth onAuth={setUser} />;
  return (
    <div className="min-h-screen lg:flex">
      <div className="min-w-0 flex-1">
        <Dashboard
          key={user.id}
          user={user}
          active={active}
          setActive={setActive}
          onMenu={() => setMenu(true)}
        />
      </div>
    </div>
  );
}
