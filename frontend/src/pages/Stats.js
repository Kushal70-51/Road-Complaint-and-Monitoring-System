import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import Loader from '../components/Loader';

const Stats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getComplaints();
      const complaints = response.complaints || [];

      const statData = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length
      };

      setStats(statData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading your statistics..." />;
  }

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>My Complaint Statistics</h1>
        <p>Overview of your complaint activity</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="stats-actions">
        <a href="/dashboard" className="btn btn-primary">View All Complaints</a>
        <a href="/upload" className="btn btn-secondary">Submit New Complaint</a>
      </div>
    </div>
  );
};

export default Stats;
