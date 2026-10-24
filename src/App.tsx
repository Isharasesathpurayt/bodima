import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BodimaProvider, useBodima } from './context/BodimaContext';
import { Navbar } from './components/layout/Navbar';
import { HomeView } from './components/home/HomeView';
import { ShoppingListView } from './components/shopping/ShoppingListView';
import { ExpenseListView } from './components/expenses/ExpenseListView';
import { CollectionListView } from './components/collections/CollectionListView';
import { MemberListView } from './components/members/MemberListView';
import { CatalogView } from './components/catalog/CatalogView';
import { CollectorAdminDashboard } from './components/admin/CollectorAdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { UserLoginScreen } from './components/auth/UserLoginScreen';
import { BodimaLoginScreen } from './components/auth/BodimaLoginScreen';
import { Footer } from './components/layout/Footer';

const MainContent: React.FC = () => {
  const { activeTab } = useBodima();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
      {(activeTab === 'home' || !activeTab) && <HomeView />}
      {activeTab === 'shopping' && <ShoppingListView />}
      {activeTab === 'expenses' && <ExpenseListView />}
      {activeTab === 'collections' && <CollectionListView />}
      {activeTab === 'members' && <MemberListView />}
      {activeTab === 'catalog' && <CatalogView />}
      {activeTab === 'admin' && <CollectorAdminDashboard />}
    </main>
  );
};

const AppRoot: React.FC = () => {
  const { user, bodima } = useAuth();

  // Step 1: User must log in first (පළමුව පරිශීලක පිවිසුම)
  if (!user) {
    return (
      <>
        <UserLoginScreen />
        <SettingsModal />
      </>
    );
  }

  // Step 2: Once user is logged in, they must connect or log into their Bodima (ඊටපස්සේ බෝඩිමට ලොග් වීම)
  if (!bodima) {
    return (
      <>
        <BodimaLoginScreen />
        <SettingsModal />
      </>
    );
  }

  // Step 3: Both User and Bodima are authenticated -> Show Full App
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f3] dark:bg-[#101713] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Navbar />
      <MainContent />
      <Footer />
      <AuthModal />
      <SettingsModal />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <BodimaProvider>
            <AppRoot />
          </BodimaProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
