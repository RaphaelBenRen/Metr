import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, Navigate } from '@tanstack/react-router'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { CreateProjectPage } from './pages/projects/CreateProjectPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { EditProjectPage } from './pages/projects/EditProjectPage'
import { ChiffragePage } from './pages/projects/ChiffragePage'
import { LibraryPage } from './pages/library/LibraryPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { HelpPage } from './pages/help/HelpPage'
import { AdminPage } from './pages/admin/AdminPage'

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  ),
})

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <Layout>{children}</Layout>
}

// Auth routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

// Protected routes
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
})

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: () => (
    <ProtectedRoute>
      <ProjectsPage />
    </ProtectedRoute>
  ),
})

const createProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/create',
  component: () => (
    <ProtectedRoute>
      <CreateProjectPage />
    </ProtectedRoute>
  ),
})

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  component: () => (
    <ProtectedRoute>
      <ProjectDetailPage />
    </ProtectedRoute>
  ),
})

const editProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/edit',
  component: () => (
    <ProtectedRoute>
      <EditProjectPage />
    </ProtectedRoute>
  ),
})

const chiffrageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/chiffrage',
  component: () => (
    <ProtectedRoute>
      <ChiffragePage />
    </ProtectedRoute>
  ),
})

// Backward compatibility route
const devisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/devis',
  component: () => (
    <ProtectedRoute>
      <ChiffragePage />
    </ProtectedRoute>
  ),
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: () => (
    <ProtectedRoute>
      <LibraryPage />
    </ProtectedRoute>
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
})

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  component: () => (
    <ProtectedRoute>
      <HelpPage />
    </ProtectedRoute>
  ),
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" />,
})

// Create router
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  projectsRoute,
  createProjectRoute,
  editProjectRoute,
  projectDetailRoute,
  chiffrageRoute,
  devisRoute,
  libraryRoute,
  settingsRoute,
  helpRoute,
  adminRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  return <RouterProvider router={router} />
}

export default App
