import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import Login from './pages/AuthPage'
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import ResumeDev from './pages/ResumeDev';
import ResumeResearch from './pages/ResumeResearch'
import ChooseResume from './pages/ChooseResume';
import ProtectedRoute from './components/ProtectedRoute';

// Resume type components
const DeveloperResume = () => <ResumeDev resumeType="developer" />;
const ResearcherResume = () => <ResumeResearch resumeType="researcher" />;
const BalancedResume = () => <ResumeDev resumeType="balanced" />;

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/login" element={<Login />} />
          <Route path="/resume" element={<ChooseResume />} />
          <Route path="/resume/developer" element={<DeveloperResume />} />
          <Route path="/resume/researcher" element={<ResearcherResume />} />
          <Route path="/resume/balanced" element={<BalancedResume />} />

          <Route path="/:id/dashboard/" element={<Dashboard />}>
          </Route>
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ChooseResume />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/resume/dev"
            element={
              <ProtectedRoute>
                <ResumeDev />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume/research"
            element={
              <ProtectedRoute>
                <ResumeResearch />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;