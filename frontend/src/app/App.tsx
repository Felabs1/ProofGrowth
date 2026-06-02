import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router';
import { Nav } from './components/Nav';
import { LandingPage } from './components/LandingPage';
import { BrowseCompetitions } from './components/BrowseCompetitions';
import { CompetitionDetail } from './components/CompetitionDetail';
import { CreateCompetition } from './components/CreateCompetition';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { LeaderboardPage } from './components/LeaderboardPage';
import { WalletProvider } from './wallet/WalletContext';

type Page = 'landing' | 'browse' | 'detail' | 'create' | 'dashboard' | 'leaderboard';

const pageToPath = (page: string, id?: string): string => {
  switch (page) {
    case 'browse':
      return '/competitions';
    case 'detail':
      return id ? `/competitions/${id}` : '/competitions';
    case 'create':
      return '/create';
    case 'dashboard':
      return '/dashboard';
    case 'leaderboard':
      return '/leaderboard';
    case 'landing':
    default:
      return '/';
  }
};

const pathToPage = (pathname: string): Page => {
  if (pathname.startsWith('/competitions/')) return 'detail';
  if (pathname.startsWith('/competitions')) return 'browse';
  if (pathname.startsWith('/create')) return 'create';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/leaderboard')) return 'leaderboard';
  return 'landing';
};

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  // Adapter so existing pages keep their onNavigate(page, id) API while routing
  // is handled by react-router under the hood (real URLs + browser history).
  const onNavigate = (page: string, id?: string) => {
    navigate(pageToPath(page, id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pg-root">
      <Nav currentPage={pathToPage(location.pathname)} onNavigate={onNavigate} />
      <Routes>
        <Route path="/" element={<LandingPage onNavigate={onNavigate} />} />
        <Route path="/competitions" element={<BrowseCompetitions onNavigate={onNavigate} />} />
        <Route path="/competitions/:id" element={<CompetitionDetailRoute onNavigate={onNavigate} />} />
        <Route path="/create" element={<CreateCompetition onNavigate={onNavigate} />} />
        <Route path="/dashboard" element={<ParticipantDashboard onNavigate={onNavigate} />} />
        <Route path="/leaderboard" element={<LeaderboardPage onNavigate={onNavigate} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function CompetitionDetailRoute({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { id } = useParams();
  return <CompetitionDetail competitionId={id ?? ''} onNavigate={onNavigate} />;
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </WalletProvider>
  );
}
