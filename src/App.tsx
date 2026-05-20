import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
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
import { About, Contact, Terms, Privacy, Safety, FAQ, EscrowPolicy, Cookies } from './pages/StaticPages';

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
        <LanguageProvider>
          <AuthProvider>
            <Router>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
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
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/escrow-policy" element={<EscrowPolicy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/careers" element={<Careers />} />
              </Routes>
            </Layout>
            <Toaster position="top-center" richColors />
          </Router>
        </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
