import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Kunden from '@/pages/Kunden';
import Websites from '@/pages/Websites';
import Projekte from '@/pages/Projekte';
import Kalender from '@/pages/Kalender';
import Verdienst from '@/pages/Verdienst';
import Rechnungen from '@/pages/Rechnungen';
import Chat from '@/pages/Chat';
import Brain from '@/pages/Brain';
import Agenten from '@/pages/Agenten';
import HermesBrain from '@/pages/HermesBrain';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="brain" element={<Brain />} />
          <Route path="agenten" element={<Agenten />} />
          <Route path="hermes-brain" element={<HermesBrain />} />
          <Route path="kunden" element={<Kunden />} />
          <Route path="websites" element={<Websites />} />
          <Route path="projekte" element={<Projekte />} />
          <Route path="kalender" element={<Kalender />} />
          <Route path="verdienst" element={<Verdienst />} />
          <Route path="rechnungen" element={<Rechnungen />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
