import { Outlet, Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import './Layout.css';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="layout-overlay">
      <nav className="glass-panel main-nav">
        <div className="nav-brand">
          <BookOpen className="brand-icon" size={28} />
          <h2>Chinese Learn</h2>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/topics" className="nav-link">Topics</Link>
          <Link to="/practice" className="nav-link">Practice</Link>
          <button onClick={handleLogout} className="btn btn-secondary logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
      <main className="container main-content">
        <Outlet />
      </main>
    </div>
  );
}
