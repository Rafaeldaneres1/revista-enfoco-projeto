import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const PostsPage = lazy(() => import('./pages/PostsPage'));
const SinglePost = lazy(() => import('./pages/SinglePost'));
const ColumnsPage = lazy(() => import('./pages/ColumnsPage'));
const ColumnistPage = lazy(() => import('./pages/ColumnistPage'));
const SingleColumn = lazy(() => import('./pages/SingleColumn'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const SingleEvent = lazy(() => import('./pages/SingleEvent'));
const EditionsPage = lazy(() => import('./pages/EditionsPage'));
const EditionReaderPage = lazy(() => import('./pages/EditionReaderPage'));
const TVProgramsPage = lazy(() => import('./pages/TVProgramsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const FloatingWhatsApp = lazy(() => import('./components/FloatingWhatsApp'));
const BackToTopButton = lazy(() => import('./components/BackToTopButton'));
const PrivacyConsent = lazy(() => import('./components/PrivacyConsent'));
const AdminApp = lazy(() => import('./AdminApp'));

function LegacyPostRedirect() {
  const { slug } = useParams();
  return <Navigate replace to={`/noticias/${slug}`} />;
}

function LegacyColumnRedirect() {
  const { slug } = useParams();
  return <Navigate replace to={`/colunas/${slug}`} />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
    </div>
  );
}

function DeferredPublicUtilities() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setReady(false);
      return undefined;
    }

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => setReady(true), { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timeoutId);
  }, [isAdmin]);

  if (!ready || isAdmin) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <BackToTopButton />
      <FloatingWhatsApp />
      <PrivacyConsent />
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="App min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quem-somos" element={<About />} />
                <Route path="/noticias" element={<PostsPage />} />
                <Route path="/noticias/:slug" element={<SinglePost />} />
                <Route path="/materia/:slug" element={<LegacyPostRedirect />} />
                <Route path="/colunas" element={<ColumnsPage />} />
                <Route path="/colunas/autor/:slug" element={<ColumnistPage />} />
                <Route path="/colunas/:slug" element={<SingleColumn />} />
                <Route path="/coluna/:slug" element={<LegacyColumnRedirect />} />
                <Route path="/eventos" element={<EventsPage />} />
                <Route path="/eventos/:slug" element={<SingleEvent />} />
                <Route path="/programas-de-tv" element={<TVProgramsPage />} />
                <Route path="/edicoes" element={<EditionsPage />} />
                <Route path="/revista" element={<EditionsPage />} />
                <Route path="/revista/:slug" element={<EditionReaderPage />} />
                <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
                <Route path="/politica-de-cookies" element={<CookiePolicyPage />} />

                <Route path="/admin/*" element={<AdminApp />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <DeferredPublicUtilities />
      </div>
    </Router>
  );
}

export default App;
