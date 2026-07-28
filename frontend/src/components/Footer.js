import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>About Portal</h4>
          <Link to="/about">About Us</Link>
          <Link to="/">Portal Features</Link>
          <Link to="/">How It Works</Link>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/map">View Map</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <Link to="/help">Help & FAQ</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/">Report Issue</Link>
        </div>
        <div className="footer-section">
          <h4>Government</h4>
          <Link to="/">Official Website</Link>
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Terms of Service</Link>
          <Link to="/">Feedback</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} National Road Complaint System | Ministry of Road Transport & Highways</p>
        <p>Designed & Developed by <strong>Kushal Sharma</strong></p>
      </div>
    </footer>
  );
};

export default Footer;
