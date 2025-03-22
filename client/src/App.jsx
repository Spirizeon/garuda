import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import Auth from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import ResumeDev from './pages/ResumeDev';

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/resume/dev" element={<ResumeDev />} />

          <Route path="/:id/dashboard/" element={<Dashboard />} >
            <Route path="profile" element={<ProfilePage />} />
          
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;