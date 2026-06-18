import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from './hooks/useDemoState';
import { AppHeader } from './components/layout/AppHeader';
import { Sidebar } from './components/layout/Sidebar';
import { AiPoweredBadge } from './components/layout/AiPoweredBadge';
import { QueueView } from './views/QueueView';
import { AgentReviewView } from './views/AgentReviewView';
import { SchedulerReviewView } from './views/SchedulerReviewView';
import { MetricsView } from './views/MetricsView';

export default function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<QueueView />} />
                <Route path="/agent-review" element={<AgentReviewView />} />
                <Route path="/scheduler-review" element={<SchedulerReviewView />} />
                <Route path="/metrics" element={<MetricsView />} />
              </Routes>
            </main>
          </div>
          <AiPoweredBadge />
        </div>
      </DemoProvider>
    </BrowserRouter>
  );
}
