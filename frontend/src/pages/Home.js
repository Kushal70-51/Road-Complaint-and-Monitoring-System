import React from 'react';
import { Link } from 'react-router-dom';
import roadBrokenImg from '../assets/icons/roadbroken.png';
import screenshot1 from '../assets/icons/Screenshot_2025-12-26_212822.png';
import screenshot2 from '../assets/icons/Screenshot_2025-12-26_212943.png';

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero hero-enhanced">
        <div className="hero-background-animation"></div>
        <div className="hero-wrapper">
          <div className="hero-content animate-fade-in">
            <span className="hero-eyebrow">🇮🇳 Government of India Initiative</span>
            <h1 className="hero-title-gradient">CITIZEN CENTRIC GOVERNANCE</h1>
            <h2>Way to Connect Citizens with the Government</h2>
            <p>An innovative platform empowering citizens to report road infrastructure issues and contribute to better communities. Submit complaints with evidence, track progress in real-time, and witness tangible improvements in your village's road infrastructure.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                <span>🚀 Register / Login</span>
              </Link>
              <Link to="/map" className="btn btn-secondary btn-large">
                <span>📍 View Status</span>
              </Link>
            </div>
          </div>
          <div className="hero-images-container animate-float">
            <div className="hero-image-frame">
              <img
                src={roadBrokenImg}
                alt="Road Issue Report"
                className="hero-image"
              />
              <span className="hero-image-badge">📷 Real complaint evidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-container services-enhanced">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">Comprehensive solutions for road infrastructure management</p>
        
        <div className="services-grid animate-stagger">
          <div className="service-card service-card-hover">
            <div className="service-icon">📋</div>
            <h3>Register / Login</h3>
            <p>Create your account to access the complaint system and submit road infrastructure grievances.</p>
            <Link to="/register" className="btn btn-primary btn-small">Get Started</Link>
          </div>

          <div className="service-card service-card-hover">
            <div className="service-icon">📍</div>
            <h3>View Status</h3>
            <p>Track the status of your complaints in real-time and receive updates on road repairs.</p>
            <Link to="/map" className="btn btn-primary btn-small">View Map</Link>
          </div>

          <div className="service-card service-card-hover">
            <div className="service-icon">📞</div>
            <h3>Contact Us</h3>
            <p>Have questions? Our support team is here to assist you with any inquiries.</p>
            <Link to="/contact" className="btn btn-primary btn-small">Get Help</Link>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="info-section info-enhanced">
        <h2 className="section-title">Why Use This Portal?</h2>
        <div className="info-items animate-stagger">
          <div className="info-item info-item-enhanced">
            <div className="info-icon">⚡</div>
            <h4>Easy Reporting</h4>
            <p>Submit road complaints with photos and location details in just a few simple steps.</p>
          </div>
          <div className="info-item info-item-enhanced">
            <div className="info-icon">👁️</div>
            <h4>Transparent Tracking</h4>
            <p>Monitor complaint status in real-time and receive updates directly.</p>
          </div>
          <div className="info-item info-item-enhanced">
            <div className="info-icon">🤝</div>
            <h4>Community Impact</h4>
            <p>Your reports contribute directly to community infrastructure development.</p>
          </div>
          <div className="info-item info-item-enhanced">
            <div className="info-icon">⚙️</div>
            <h4>Efficient Processing</h4>
            <p>Automated systems ensure your grievance is processed promptly.</p>
          </div>
          <div className="info-item info-item-enhanced">
            <div className="info-icon">📊</div>
            <h4>Data-Driven Action</h4>
            <p>Comprehensive data collection enables better planning and resource allocation.</p>
          </div>
          <div className="info-item info-item-enhanced">
            <div className="info-icon">🎯</div>
            <h4>Citizen Empowerment</h4>
            <p>Direct participation in governance ensures citizen voices are heard.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section how-it-works-enhanced">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="services-grid animate-stagger">
            <div className="service-card how-it-works-card">
              <div className="service-icon how-it-works-icon">1️⃣</div>
              <h3>Create Account</h3>
              <p>Register with your email and mobile number to create a secure account on the portal.</p>
            </div>
            <div className="service-card how-it-works-card">
              <div className="service-icon how-it-works-icon">2️⃣</div>
              <h3>Submit Complaint</h3>
              <p>Upload photos and provide location details with detailed description of the road issue.</p>
            </div>
            <div className="service-card how-it-works-card">
              <div className="service-icon how-it-works-icon">3️⃣</div>
              <h3>Track Progress</h3>
              <p>Monitor your complaint status and receive notifications about actions taken by authorities.</p>
            </div>
            <div className="service-card how-it-works-card">
              <div className="service-icon how-it-works-icon">4️⃣</div>
              <h3>Resolution</h3>
              <p>Get updates when your complaint is resolved and infrastructure improvements are completed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="screenshots-section screenshots-enhanced">
        <h2 className="section-title">Platform Features</h2>
        <p className="section-subtitle">Explore our user-friendly interface and powerful features</p>
        
        <div className="screenshots-grid animate-stagger">
          <div className="screenshot-card screenshot-card-enhanced">
            <img src={screenshot1} alt="Dashboard View" className="screenshot-img" />
            <div className="screenshot-info">
              <h4>📊 Dashboard</h4>
              <p>View all your reported complaints at a glance</p>
            </div>
          </div>
          <div className="screenshot-card screenshot-card-enhanced">
            <img src={screenshot2} alt="Map View" className="screenshot-img" />
            <div className="screenshot-info">
              <h4>🗺️ Location Tracking</h4>
              <p>See all road issues on an interactive map</p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2>Seen a pothole, damaged road, or broken streetlight?</h2>
          <p>Report it in minutes and help your local authorities act faster.</p>
          <Link to="/register" className="btn btn-primary btn-large">🚀 Report an Issue Now</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
