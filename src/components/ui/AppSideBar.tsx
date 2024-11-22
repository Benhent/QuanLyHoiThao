import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../Context/AuthProviderContext'
import { useState } from "react"
import { Home, User, LogOut, Menu, Building2, Award, Newspaper } from "lucide-react"
import SaviourLogo from "@/asset/Saviour.svg";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isDesktop?: boolean
}

export function AppSideBar({ className, isDesktop = false }: SidebarProps) {
  const { logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const routes = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: User, label: 'Author', path: '/Author' },
    { icon: Newspaper, label: 'Article', path: '/Article' },
    { icon: Building2, label: 'Institution', path: '/Institution' },
    { icon: Award, label: 'Award', path: '/Award' },
  ]

  const SidebarContent = (
    <ScrollArea className="h-full py-6 pl-6 pr-6">
      {/* <h2 className="mb-4 text-lg font-semibold">Navigation</h2> */}
      <img src={SaviourLogo} alt="Logo" className="mb-4" />
      <div className="space-y-1">
        {routes.map((route) => (
          <Button
            key={route.path}
            variant={location.pathname === route.path ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link to={route.path} onClick={() => setOpen(false)}>
              <route.icon className="mr-2 h-4 w-4" />
              {route.label}
            </Link>
          </Button>
        ))}
      </div>
      <div className="mt-6">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={() => {
            logout()
            setOpen(false)
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </ScrollArea>
  )

  if (isDesktop) {
    return (
      <div className={cn("hidden md:block", className)}>
        {SidebarContent}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        {SidebarContent}
      </SheetContent>
    </Sheet>
  )
}