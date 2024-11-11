import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from '../Context/AuthProviderContext';
import { AppSideBar } from "../components/ui/AppSideBar";

export default function RootLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/sign-in");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <AppSideBar className="w-64 border-r" isDesktop={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-4 md:px-6">
          <AppSideBar className="md:hidden" isDesktop={false} />
          <h1 className="text-lg font-semibold ml-4">Your App Name</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
