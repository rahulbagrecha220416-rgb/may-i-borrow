import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ItemProvider } from './context/ItemContext';
import { GroupProvider } from './context/GroupContext';
import { RequestProvider } from './context/RequestContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import ItemDetails from './pages/ItemDetails';
import AddItem from './pages/AddItem';
import Profile from './pages/Profile';
import CreateGroup from './pages/CreateGroup';
import AddRequest from './pages/AddRequest';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Upgrade from './pages/Upgrade'; // Import Upgrade Page
import JoinGroup from './pages/JoinGroup';
import AuthCallback from './pages/AuthCallback';
import MyItems from './pages/MyItems';
import EditItem from './pages/EditItem';
import MyBorrowedItems from './pages/MyBorrowedItems';
import MyLentItems from './pages/MyLentItems';
import Mediations from './pages/Mediations';
import Inquiries from './pages/Inquiries';

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
