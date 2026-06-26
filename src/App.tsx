import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';
import { CartProvider } from './CartContext';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

// Pages (to be created)
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import CreateListing from './pages/CreateListing';
import Messages from './pages/Messages';
import Admin from './pages/Admin';
import KYC from './pages/KYC';
import SellerDashboard from './pages/SellerDashboard';
import PromoteListing from './pages/PromoteListing';
import TransactionDetail from './pages/TransactionDetail';
import Careers from './pages/Careers';
import Offers from './pages/Offers';
import Referrals from './pages/Referrals';
import Onboarding from './pages/Onboarding';
import { About, Contact } from './pages/StaticPages';
import { 
  TermsPage, 
  PrivacyPage, 
  EscrowPolicyPage, 
  CookiesPage, 
  SafetyPage, 
  FAQPage,
  BuyerRulesPage,
  SellerRulesPage,
  ProviderStandardsPage,
  ProhibitedItemsPage,
  DisputePolicyPage
} from './pages/PolicyCenter';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <Router>
                <ScrollToTop />
                <Layout>
                  <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/listings" element={<Listings />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/referrals" element={<PrivateRoute><Referrals /></PrivateRoute>} />
                  <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                  <Route path="/create-listing" element={<PrivateRoute><CreateListing /></PrivateRoute>} />
                  <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
                  <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
                  <Route path="/kyc" element={<PrivateRoute><KYC /></PrivateRoute>} />
                  <Route path="/seller-dashboard" element={<PrivateRoute><SellerDashboard /></PrivateRoute>} />
                  <Route path="/promote/:id" element={<PrivateRoute><PromoteListing /></PrivateRoute>} />
                  <Route path="/transactions/:id" element={<PrivateRoute><TransactionDetail /></PrivateRoute>} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/escrow-policy" element={<EscrowPolicyPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/safety" element={<SafetyPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/buyer-rules" element={<BuyerRulesPage />} />
                  <Route path="/seller-rules" element={<SellerRulesPage />} />
                  <Route path="/provider-standards" element={<ProviderStandardsPage />} />
                  <Route path="/prohibited-items" element={<ProhibitedItemsPage />} />
                  <Route path="/dispute-policy" element={<DisputePolicyPage />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/offers" element={<Offers />} />
                </Routes>
              </Layout>
              <Toaster position="top-center" richColors />
            </Router>
          </CartProvider>
        </AuthProvider>
        </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
