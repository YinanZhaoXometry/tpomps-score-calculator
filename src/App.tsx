import { GraduationCap } from 'lucide-react';
import { useAuthSession } from './hooks/useAuthSession';
import { LoginPage } from './components/LoginPage';
import { MainPage } from './components/MainPage';
import { ToastProvider } from './components/Toast';

function App() {
  const { user, loading } = useAuthSession();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center animate-pulse">
          <GraduationCap className="w-6 h-6 text-background" />
        </div>
      </div>
    );
  }

  return user ? (
    <ToastProvider>
      <MainPage user={user} />
    </ToastProvider>
  ) : (
    <LoginPage />
  );
}

export default App;
