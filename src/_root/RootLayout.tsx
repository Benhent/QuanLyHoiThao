import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from '../Context/AuthProviderContext';

export default function RootLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/sign-in");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="w-full md:flex">
      <section className="flex flex-1 h-full">
        <Outlet />
      </section>
    </div>
  );
}
