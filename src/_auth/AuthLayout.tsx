import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from '../Context/AuthProviderContext'

export default function AuthLayout() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="flex flex-1 justify-center items-center flex-col">
      <Outlet />
    </section>
  )
}