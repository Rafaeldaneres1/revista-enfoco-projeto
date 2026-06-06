import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import BackToTopButton from './components/BackToTopButton';
import PrivacyConsent from './components/PrivacyConsent';
import ScrollToTop from './components/ScrollToTop';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

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
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPosts = lazy(() => import('./pages/AdminPosts'));
const AdminPostForm = lazy(() => import('./pages/AdminPostForm'));
const AdminColumns = lazy(() => import('./pages/AdminColumns'));
const AdminColumnForm = lazy(() => import('./pages/AdminColumnForm'));
const AdminColumnists = lazy(() => import('./pages/AdminColumnists'));
const AdminColumnistForm = lazy(() => import('./pages/AdminColumnistForm'));
const AdminEvents = lazy(() => import('./pages/AdminEvents'));
const AdminEventForm = lazy(() => import('./pages/AdminEventForm'));
const AdminEditions = lazy(() => import('./pages/AdminEditions'));
const AdminEditionForm = lazy(() => import('./pages/AdminEditionForm'));
const AdminAboutForm = lazy(() => import('./pages/AdminAboutForm'));
const AdminHomeForm = lazy(() => import('./pages/AdminHomeForm'));
const AdminTeams = lazy(() => import('./pages/AdminTeams'));
const AdminTeamForm = lazy(() => import('./pages/AdminTeamForm'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminCategoryForm = lazy(() => import('./pages/AdminCategoryForm'));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminBannerForm = lazy(() => import('./pages/AdminBannerForm'));
const AdminComments = lazy(() => import('./pages/AdminComments'));
const AdminPrivacyForm = lazy(() => import('./pages/AdminPrivacyForm'));

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

function ConditionalAuthProvider({ children }) {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return children;
}

function App() {
  return (
    <Router>
      <ConditionalAuthProvider>
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
                <Route path="/edicoes" element={<EditionsPage />} />
                <Route path="/revista" element={<EditionsPage />} />
                <Route path="/revista/:slug" element={<EditionReaderPage />} />
                <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
                <Route path="/politica-de-cookies" element={<CookiePolicyPage />} />

                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                <Route path="/admin/posts" element={<PrivateRoute><AdminPosts /></PrivateRoute>} />
                <Route path="/admin/posts/new" element={<PrivateRoute><AdminPostForm /></PrivateRoute>} />
                <Route path="/admin/posts/edit/:id" element={<PrivateRoute><AdminPostForm /></PrivateRoute>} />
                <Route path="/admin/columns" element={<PrivateRoute><AdminColumns /></PrivateRoute>} />
                <Route path="/admin/columns/new" element={<PrivateRoute><AdminColumnForm /></PrivateRoute>} />
                <Route path="/admin/columns/edit/:id" element={<PrivateRoute><AdminColumnForm /></PrivateRoute>} />
                <Route path="/admin/columns/columnists" element={<PrivateRoute><AdminColumnists /></PrivateRoute>} />
                <Route path="/admin/columns/columnists/new" element={<PrivateRoute><AdminColumnistForm /></PrivateRoute>} />
                <Route path="/admin/columns/columnists/edit/:id" element={<PrivateRoute><AdminColumnistForm /></PrivateRoute>} />
                <Route path="/admin/events" element={<PrivateRoute><AdminEvents /></PrivateRoute>} />
                <Route path="/admin/events/new" element={<PrivateRoute><AdminEventForm /></PrivateRoute>} />
                <Route path="/admin/events/edit/:id" element={<PrivateRoute><AdminEventForm /></PrivateRoute>} />
                <Route path="/admin/editions" element={<PrivateRoute><AdminEditions /></PrivateRoute>} />
                <Route path="/admin/editions/new" element={<PrivateRoute><AdminEditionForm /></PrivateRoute>} />
                <Route path="/admin/editions/edit/:id" element={<PrivateRoute><AdminEditionForm /></PrivateRoute>} />
                <Route path="/admin/home" element={<PrivateRoute><AdminHomeForm /></PrivateRoute>} />
                <Route path="/admin/about" element={<PrivateRoute><AdminAboutForm /></PrivateRoute>} />
                <Route path="/admin/team" element={<PrivateRoute><AdminTeams /></PrivateRoute>} />
                <Route path="/admin/team/new" element={<PrivateRoute><AdminTeamForm /></PrivateRoute>} />
                <Route path="/admin/team/edit/:id" element={<PrivateRoute><AdminTeamForm /></PrivateRoute>} />
                <Route path="/admin/categories" element={<PrivateRoute><AdminCategories /></PrivateRoute>} />
                <Route path="/admin/categories/new" element={<PrivateRoute><AdminCategoryForm /></PrivateRoute>} />
                <Route path="/admin/categories/edit/:id" element={<PrivateRoute><AdminCategoryForm /></PrivateRoute>} />
                <Route path="/admin/banners" element={<PrivateRoute><AdminBanners /></PrivateRoute>} />
                <Route path="/admin/banners/new" element={<PrivateRoute><AdminBannerForm /></PrivateRoute>} />
                <Route path="/admin/banners/edit/:id" element={<PrivateRoute><AdminBannerForm /></PrivateRoute>} />
                <Route path="/admin/comments" element={<PrivateRoute><AdminComments /></PrivateRoute>} />
                <Route path="/admin/privacy" element={<PrivateRoute><AdminPrivacyForm /></PrivateRoute>} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <BackToTopButton />
          <FloatingWhatsApp />
          <PrivacyConsent />
        </div>
      </ConditionalAuthProvider>
    </Router>
  );
}

export default App;
