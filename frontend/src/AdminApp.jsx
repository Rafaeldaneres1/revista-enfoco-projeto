import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import './admin.css';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

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
const AdminTVPrograms = lazy(() => import('./pages/AdminTVPrograms'));
const AdminTVProgramForm = lazy(() => import('./pages/AdminTVProgramForm'));
const AdminComments = lazy(() => import('./pages/AdminComments'));
const AdminPrivacyForm = lazy(() => import('./pages/AdminPrivacyForm'));

const AdminLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-charcoal/20 border-t-charcoal" />
  </div>
);

const Protected = ({ children }) => <PrivateRoute>{children}</PrivateRoute>;

const AdminApp = () => (
  <AuthProvider>
    <Suspense fallback={<AdminLoader />}>
      <Routes>
        <Route index element={<AdminLogin />} />
        <Route path="dashboard" element={<Protected><AdminDashboard /></Protected>} />
        <Route path="posts" element={<Protected><AdminPosts /></Protected>} />
        <Route path="posts/new" element={<Protected><AdminPostForm /></Protected>} />
        <Route path="posts/edit/:id" element={<Protected><AdminPostForm /></Protected>} />
        <Route path="columns" element={<Protected><AdminColumns /></Protected>} />
        <Route path="columns/new" element={<Protected><AdminColumnForm /></Protected>} />
        <Route path="columns/edit/:id" element={<Protected><AdminColumnForm /></Protected>} />
        <Route path="columns/columnists" element={<Protected><AdminColumnists /></Protected>} />
        <Route path="columns/columnists/new" element={<Protected><AdminColumnistForm /></Protected>} />
        <Route path="columns/columnists/edit/:id" element={<Protected><AdminColumnistForm /></Protected>} />
        <Route path="events" element={<Protected><AdminEvents /></Protected>} />
        <Route path="events/new" element={<Protected><AdminEventForm /></Protected>} />
        <Route path="events/edit/:id" element={<Protected><AdminEventForm /></Protected>} />
        <Route path="editions" element={<Protected><AdminEditions /></Protected>} />
        <Route path="editions/new" element={<Protected><AdminEditionForm /></Protected>} />
        <Route path="editions/edit/:id" element={<Protected><AdminEditionForm /></Protected>} />
        <Route path="home" element={<Protected><AdminHomeForm /></Protected>} />
        <Route path="about" element={<Protected><AdminAboutForm /></Protected>} />
        <Route path="team" element={<Protected><AdminTeams /></Protected>} />
        <Route path="team/new" element={<Protected><AdminTeamForm /></Protected>} />
        <Route path="team/edit/:id" element={<Protected><AdminTeamForm /></Protected>} />
        <Route path="categories" element={<Protected><AdminCategories /></Protected>} />
        <Route path="categories/new" element={<Protected><AdminCategoryForm /></Protected>} />
        <Route path="categories/edit/:id" element={<Protected><AdminCategoryForm /></Protected>} />
        <Route path="banners" element={<Protected><AdminBanners /></Protected>} />
        <Route path="banners/new" element={<Protected><AdminBannerForm /></Protected>} />
        <Route path="banners/edit/:id" element={<Protected><AdminBannerForm /></Protected>} />
        <Route path="tv-programs" element={<Protected><AdminTVPrograms /></Protected>} />
        <Route path="tv-programs/new" element={<Protected><AdminTVProgramForm /></Protected>} />
        <Route path="tv-programs/edit/:id" element={<Protected><AdminTVProgramForm /></Protected>} />
        <Route path="comments" element={<Protected><AdminComments /></Protected>} />
        <Route path="privacy" element={<Protected><AdminPrivacyForm /></Protected>} />
      </Routes>
    </Suspense>
  </AuthProvider>
);

export default AdminApp;
