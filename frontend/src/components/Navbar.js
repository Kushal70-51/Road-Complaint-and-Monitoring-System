import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // determine if current route is an admin page
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="header-container">
        <div className="header-logo">
          <div className="emblem">🛣️</div>
          <div className="header-text">
            <h1>Road Complaint System</h1>
            <p>National Portal for Road Infrastructure Grievances</p>
          </div>
        </div>
        <div className="portal-badge">NATIONAL PORTAL</div>
      </header>

      <nav className="navbar">
        <div className="nav-brand">
          {/* Show Home only when NOT authenticated */}
          {!isAuthenticated && <Link to="/">Home</Link>}
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {!isAuthenticated ? (
            // not logged in
            <>
              <li><Link to="/register">Register / Login</Link></li>
              <li><Link to="/map">View Status</Link></li>
            </>
          ) : user && user.role ? (
            // admin user: only dashboard link shown; logout available on profile
            <>
              <li><Link to="/admin">Admin Dashboard</Link></li>
            </>
          ) : (
            // regular authenticated user
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/upload">Submit Complaint</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/map">View Map</Link></li>
              <li><Link to="/stats">Statistics</Link></li>
            </>
          )}

          {/* public informational links hidden for admin users */}
          {!(isAuthenticated && user && user.role) && (
            <>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/help">Help & Support</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </>
          )}
          {!isAuthenticated && <li><Link to="/admin/login">Admin Login</Link></li>}
        </ul>
      </nav>
    </>
  );
};

export default Navbar;
