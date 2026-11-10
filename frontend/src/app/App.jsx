
import { Navigate, Route, Routes } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Interns from '../pages/Interns';
import CreateIntern from '../pages/CreateIntern';
import InternProfile from '../pages/InternProfile';
import CoreValues from '../pages/CoreValues';
import WorkspaceModule from '../pages/WorkspaceModule';
import LifecycleSummary from '../pages/LifecycleSummary';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/about" element={<CoreValues />} />
      <Route path="/values" element={<CoreValues />} />

      <Route path="/" element={<Dashboard />} />

      <Route path="/interns" element={<Interns />} />
      <Route path="/interns/new" element={<CreateIntern />} />
      <Route path="/interns/:id" element={<InternProfile />} />

      {/* Intern lifecycle overview */}
      <Route
        path="/lifecycle-summary"
        element={<LifecycleSummary />}
      />

      {/* Goals, leave, feedback, learning, and other modules */}
      <Route path="/:kind" element={<WorkspaceModule />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

