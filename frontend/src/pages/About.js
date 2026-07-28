import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="about-page">
      <div className="page-header">
        <div className="page-header-icon">🛣️</div>
        <h1>About Us</h1>
        <p>Learn more about the National Road Complaint System and our mission</p>
      </div>

      <div className="about-container">
        <section className="about-section">
          <div className="about-section-header">
            <span className="about-section-icon">🎯</span>
            <h2>Our Mission</h2>
          </div>
          <p>To revolutionize infrastructure by empowering communities to maintain and improve their road networks using cutting-edge technology. We believe better roads lead to safer communities and enhanced quality of life.</p>
        </section>

        <section className="about-section">
          <div className="about-section-header">
            <span className="about-section-icon">🔭</span>
            <h2>Our Vision</h2>
          </div>
          <p>To become the leading digital platform for infrastructure management, connecting citizens with local and national authorities through transparent, efficient, and technology-driven solutions.</p>
        </section>

        <section className="about-section">
          <div className="about-section-header">
            <span className="about-section-icon">⭐</span>
            <h2>Key Features</h2>
          </div>
          <div className="about-feature-grid">
            <div className="about-feature-card"><span>🖱️</span> User-Friendly Interface for easy complaint submission</div>
            <div className="about-feature-card"><span>📍</span> GPS Integration for precise location tracking</div>
            <div className="about-feature-card"><span>👁️</span> Real-time Tracking and status updates</div>
            <div className="about-feature-card"><span>📷</span> Photo Upload capability for evidence documentation</div>
            <div className="about-feature-card"><span>🗂️</span> Admin Dashboard for comprehensive management</div>
            <div className="about-feature-card"><span>🔒</span> Secure Authentication and data encryption</div>
            <div className="about-feature-card"><span>📊</span> Data Analytics and reporting</div>
            <div className="about-feature-card"><span>📱</span> Mobile-Responsive design</div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-header">
            <span className="about-section-icon">⚙️</span>
            <h2>How It Works</h2>
          </div>
          <ol className="about-steps">
            <li><span><strong>Registration:</strong> Citizens create accounts with basic information</span></li>
            <li><span><strong>Complaint Submission:</strong> Upload photos, provide location, describe the issue</span></li>
            <li><span><strong>Auto-Analysis:</strong> System categorizes and prioritizes complaints</span></li>
            <li><span><strong>Admin Review:</strong> Administrators assess and assign resources</span></li>
            <li><span><strong>Resolution:</strong> Work orders are issued and repairs scheduled</span></li>
            <li><span><strong>Tracking:</strong> Citizens monitor progress through their dashboard</span></li>
          </ol>
        </section>

        <section className="about-section">
          <div className="about-section-header">
            <span className="about-section-icon">🤝</span>
            <h2>Our Commitment</h2>
          </div>
          <p>We are committed to providing a reliable, secure, and efficient platform that genuinely addresses the road infrastructure needs of our citizens. Our dedicated team works continuously to improve our services.</p>
        </section>

        <section className="home-cta">
          <div className="home-cta-inner">
            <h2>Ready to make your roads better?</h2>
            <p>Join citizens across the country reporting and tracking road issues.</p>
            <Link to="/register" className="btn btn-primary btn-large">🚀 Get Started</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
