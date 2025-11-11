import { useState } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  HelpCircle,
  Settings,
  Shield,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import logoWhite from '@/assets/Metr_white_orange_dot_LOGO.png'
import logoSmall from '@/assets/M_white_orange_dot_logo.png'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Projets', path: '/projects', icon: FolderOpen },
  { name: 'Bibliothèque', path: '/library', icon: BookOpen },
  { name: 'Aide', path: '/help', icon: HelpCircle },
  { name: 'Paramètres', path: '/settings', icon: Settings },
  { name: 'Administration', path: '/admin', icon: Shield, adminOnly: true },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  const handleNavClick = (path: string) => {
    navigate({ to: path })
    // Expand sidebar when clicking on a nav item while collapsed
    if (isCollapsed) {
      setIsCollapsed(false)
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-primary text-white transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-white/10">
        <img
          src={isCollapsed ? logoSmall : logoWhite}
          alt="Metr."
          className={cn(
            "transition-all duration-300",
            isCollapsed ? "h-5" : "h-6"
          )}
        />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center hover:bg-primary/90 transition-colors z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          // Skip admin items if user is not admin
          if (item.adminOnly && user?.role !== 'admin') {
            return null
          }

          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                'flex items-center w-full px-4 py-3 rounded-lg transition-colors',
                'hover:bg-white/10',
                isActive && 'bg-white/20',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </button>
          )
        })}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="border-t border-white/10">
          <div className="p-4">
            {isCollapsed ? (
              // Collapsed user profile - just the avatar
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Expanded user profile
              <>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-white/70 capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Déconnexion</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
