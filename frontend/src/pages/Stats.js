import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { complaintService } from '../services/api';
import Loader from '../components/Loader';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Stats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await complaintService.getComplaints();
      const complaints = response.complaints || [];

      const statData = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length
      };

      setStats(statData);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load your statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading your statistics..." />;
  }

  const chartData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [
      {
        label: 'Complaints',
        data: [stats.pending, stats.inProgress, stats.resolved],
        backgroundColor: ['#FFC107', '#2196F3', '#4CAF50']
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  };

  return (
    <div className="stats-page">
      <div className="stats-header">
        <div className="page-header-icon">📊</div>
        <h1>My Complaint Statistics</h1>
        <p>Overview of your complaint activity</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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

      {stats.total > 0 && (
        <div className="stats-chart" style={{ maxWidth: 480, margin: '2rem auto' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      <div className="stats-actions">
        <Link to="/dashboard" className="btn btn-primary">View All Complaints</Link>
        <Link to="/upload" className="btn btn-secondary">Submit New Complaint</Link>
      </div>
    </div>
  );
};

export default Stats;
