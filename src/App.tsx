import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Library } from './pages/Library';
import { Player } from './pages/Player';
import { Settings } from './pages/Settings';
import { CompeteHome } from './pages/compete/CompeteHome';
import { SetupWizard } from './pages/compete/SetupWizard';
import { CompeteHub } from './pages/compete/CompeteHub';
import { TvView } from './pages/compete/TvView';
import { StationView } from './pages/compete/StationView';
import { HostView } from './pages/compete/HostView';
import { BoardView } from './pages/compete/BoardView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Library />} />
          <Route path="/play/:gameId" element={<Player />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/compete" element={<CompeteHome />} />
          <Route path="/compete/new" element={<SetupWizard />} />
          <Route path="/compete/:code" element={<CompeteHub />} />
          <Route path="/compete/:code/tv" element={<TvView />} />
          <Route path="/compete/:code/station/:stationId" element={<StationView />} />
          <Route path="/compete/:code/host" element={<HostView />} />
          <Route path="/compete/:code/board" element={<BoardView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
