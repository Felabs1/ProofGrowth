import { useState } from 'react';
import { Nav } from './components/Nav';
import { LandingPage } from './components/LandingPage';
import { BrowseCompetitions } from './components/BrowseCompetitions';
import { CompetitionDetail } from './components/CompetitionDetail';
import { CreateCompetition } from './components/CreateCompetition';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { LeaderboardPage } from './components/LeaderboardPage';
import { WalletProvider } from './wallet/WalletContext';

type Page = 'landing' | 'browse' | 'detail' | 'create' | 'dashboard' | 'leaderboard';

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [competitionId, setCompetitionId] = useState<string>('');

  const navigate = (p: string, id?: string) => {
    setPage(p as Page);
    if (id) setCompetitionId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <WalletProvider>
      <div className="pg-root">
        <Nav currentPage={page} onNavigate={navigate} />
        {page === 'landing' && <LandingPage onNavigate={navigate} />}
        {page === 'browse' && <BrowseCompetitions onNavigate={navigate} />}
        {page === 'detail' && <CompetitionDetail competitionId={competitionId} onNavigate={navigate} />}
        {page === 'create' && <CreateCompetition onNavigate={navigate} />}
        {page === 'dashboard' && <ParticipantDashboard onNavigate={navigate} />}
        {page === 'leaderboard' && <LeaderboardPage onNavigate={navigate} />}
      </div>
    </WalletProvider>
  );
}
