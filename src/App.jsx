import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ItemProvider } from './context/ItemContext';
import { GroupProvider } from './context/GroupContext';
import { RequestProvider } from './context/RequestContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Route-level code splitting — each page is its own chunk, shrinking the initial bundle.
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));
const ItemDetails = lazy(() => import('./pages/ItemDetails'));
const AddItem = lazy(() => import('./pages/AddItem'));
const Profile = lazy(() => import('./pages/Profile'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const AddRequest = lazy(() => import('./pages/AddRequest'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const JoinGroup = lazy(() => import('./pages/JoinGroup'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const MyItems = lazy(() => import('./pages/MyItems'));
const EditItem = lazy(() => import('./pages/EditItem'));
const MyBorrowedItems = lazy(() => import('./pages/MyBorrowedItems'));
const MyLentItems = lazy(() => import('./pages/MyLentItems'));
const Mediations = lazy(() => import('./pages/Mediations'));
const Inquiries = lazy(() => import('./pages/Inquiries'));

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b7c73] mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <GroupProvider>
            <ItemProvider>
              <RequestProvider>
                <NotificationProvider>
                  <HashRouter>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b7c73]"></div>
                      </div>
                    }>
                    <Routes>
                      <Route path="/" element={<AppLayout />}>
                        <Route index element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="groups" element={
                          <ProtectedRoute>
                            <Groups />
                          </ProtectedRoute>
                        } />
                        <Route path="groups/:groupId" element={
                          <ProtectedRoute>
                            <GroupDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="items/:itemId" element={
                          <ProtectedRoute>
                            <ItemDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="add-item" element={
                          <ProtectedRoute>
                            <AddItem />
                          </ProtectedRoute>
                        } />
                        <Route path="add-request" element={
                          <ProtectedRoute>
                            <AddRequest />
                          </ProtectedRoute>
                        } />
                        <Route path="notifications" element={
                          <ProtectedRoute>
                            <Notifications />
                          </ProtectedRoute>
                        } />
                        <Route path="settings" element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        } />
                        <Route path="upgrade" element={
                          <ProtectedRoute>
                            <Upgrade />
                          </ProtectedRoute>
                        } />
                        <Route path="profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="groups/create" element={
                          <ProtectedRoute>
                            <CreateGroup />
                          </ProtectedRoute>
                        } />
                        <Route path="auth/callback" element={<AuthCallback />} />
                        <Route path="login" element={<Login />} />
                        {/* Public Join Route */}
                        <Route path="join/:groupId" element={<JoinGroup />} />
                        {/* My Items Routes */}
                        <Route path="my-items" element={
                          <ProtectedRoute>
                            <MyItems />
                          </ProtectedRoute>
                        } />
                        <Route path="borrowed" element={
                          <ProtectedRoute>
                            <MyBorrowedItems />
                          </ProtectedRoute>
                        } />
                        <Route path="lent" element={
                          <ProtectedRoute>
                            <MyLentItems />
                          </ProtectedRoute>
                        } />
                        <Route path="edit-item/:itemId" element={
                          <ProtectedRoute>
                            <EditItem />
                          </ProtectedRoute>
                        } />
                        <Route path="mediations" element={
                          <ProtectedRoute>
                            <Mediations />
                          </ProtectedRoute>
                        } />
                        <Route path="inquiries" element={
                          <ProtectedRoute>
                            <Inquiries />
                          </ProtectedRoute>
                        } />
                      </Route>
                    </Routes>
                    </Suspense>
                  </HashRouter>
                </NotificationProvider>
              </RequestProvider>
            </ItemProvider>
          </GroupProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
