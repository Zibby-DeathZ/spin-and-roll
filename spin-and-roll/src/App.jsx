import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import Gate from './components/Gate';
import Home from './pages/Home';
import Login from './pages/Login';
import DMDashboard from './pages/DMDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import { GMScreen, PlayerScreen, TVScreen } from './pages/SessionScreens';

// HashRouter so deep links work on GitHub Pages without a server.
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dm" element={<Gate role="dm"><DMDashboard /></Gate>} />
          <Route path="/me" element={<Gate><PlayerDashboard /></Gate>} />
          <Route path="/session/:sid/gm" element={<Gate role="dm"><GMScreen /></Gate>} />
          <Route path="/session/:sid/tv" element={<Gate role="dm"><TVScreen /></Gate>} />
          <Route path="/session/:sid/play" element={<Gate><PlayerScreen /></Gate>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
