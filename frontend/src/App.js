import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import About from './pages/About';
import PostsPage from './pages/PostsPage';
import SinglePost from './pages/SinglePost';
import ColumnsPage from './pages/ColumnsPage';
import SingleColumn from './pages/SingleColumn';
import EventsPage from './pages/EventsPage';
import SingleEvent from './pages/SingleEvent';
import EditionsPage from './pages/EditionsPage';
import EditionReaderPage from './pages/EditionReaderPage';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPosts from './pages/AdminPosts';
import AdminPostForm from './pages/AdminPostForm';
import AdminColumns from './pages/AdminColumns';
import AdminColumnForm from './pages/AdminColumnForm';
import AdminColumnists from './pages/AdminColumnists';
import AdminColumnistForm from './pages/AdminColumnistForm';
import AdminEvents from './pages/AdminEvents';
import AdminEventForm from './pages/AdminEventForm';
import AdminEditions from './pages/AdminEditions';
import AdminEditionForm from './pages/AdminEditionForm';
import AdminAboutForm from './pages/AdminAboutForm';
import AdminHomeForm from './pages/AdminHomeForm';
import AdminTeams from './pages/AdminTeams';
import AdminTeamForm from './pages/AdminTeamForm';
import AdminCategories from './pages/AdminCategories';
import AdminCategoryForm from './pages/AdminCategoryForm';

function LegacyPostRedirect() {
  const { slug } = useParams();
  return <Navigate replace to={`/noticias/${slug}`} />;
}

function LegacyColumnRedirect() {
  const { slug } = useParams();
  return <Navigate replace to={`/colunas/${slug}`} />;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="App min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quem-somos" element={<About />} />
            <Route path="/noticias" element={<PostsPage />} />
            <Route path="/noticias/:slug" element={<SinglePost />} />
            <Route path="/materia/:slug" element={<LegacyPostRedirect />} />
            <Route path="/colunas" element={<ColumnsPage />} />
            <Route path="/colunas/:slug" element={<SingleColumn />} />
            <Route path="/coluna/:slug" element={<LegacyColumnRedirect />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/eventos/:slug" element={<SingleEvent />} />
            <Route path="/edicoes" element={<EditionsPage />} />
            <Route path="/revista" element={<EditionsPage />} />
            <Route path="/revista/:slug" element={<EditionReaderPage />} />

            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/posts/new" element={<AdminPostForm />} />
            <Route path="/admin/posts/edit/:id" element={<AdminPostForm />} />
            <Route path="/admin/columns" element={<AdminColumns />} />
            <Route path="/admin/columns/new" element={<AdminColumnForm />} />
            <Route path="/admin/columns/edit/:id" element={<AdminColumnForm />} />
            <Route path="/admin/columns/columnists" element={<AdminColumnists />} />
            <Route path="/admin/columns/columnists/new" element={<AdminColumnistForm />} />
            <Route path="/admin/columns/columnists/edit/:id" element={<AdminColumnistForm />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/events/new" element={<AdminEventForm />} />
            <Route path="/admin/events/edit/:id" element={<AdminEventForm />} />
            <Route path="/admin/editions" element={<AdminEditions />} />
            <Route path="/admin/editions/new" element={<AdminEditionForm />} />
            <Route path="/admin/editions/edit/:id" element={<AdminEditionForm />} />
            <Route path="/admin/home" element={<AdminHomeForm />} />
            <Route path="/admin/about" element={<AdminAboutForm />} />
            <Route path="/admin/team" element={<AdminTeams />} />
            <Route path="/admin/team/new" element={<AdminTeamForm />} />
            <Route path="/admin/team/edit/:id" element={<AdminTeamForm />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/categories/new" element={<AdminCategoryForm />} />
            <Route path="/admin/categories/edit/:id" element={<AdminCategoryForm />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
