import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { complaintService } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFilters();
  }, [complaints, statusFilter, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await complaintService.getComplaints();
      setComplaints(response.complaints || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to load your complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = complaints;

    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(c =>
        c.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  };

  const hasActiveFilters = Boolean(statusFilter || locationFilter);

  const summary = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name || 'User'}!</h1>
          <p>Manage and track all your road complaints from here</p>
        </div>
        {user && (
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && complaints.length > 0 && (
        <div className="stats-grid dashboard-stats-row">
          <div className="stat-card">
            <h3>Total</h3>
            <div className="stat-number">{summary.total}</div>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <div className="stat-number">{summary.pending}</div>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <div className="stat-number">{summary.inProgress}</div>
          </div>
          <div className="stat-card">
            <h3>Resolved</h3>
            <div className="stat-number">{summary.resolved}</div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <input
            type="text"
            placeholder="Search by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setStatusFilter(''); setLocationFilter(''); }}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="complaints-section">
        <div className="section-header">
          <h2>
            Your Complaints
            {!loading && !error && (
              <span className="section-header-count">
                {hasActiveFilters
                  ? `${filteredComplaints.length} of ${complaints.length}`
                  : complaints.length}
              </span>
            )}
          </h2>
          <Link to="/upload" className="btn btn-primary">+ Submit New Complaint</Link>
        </div>

        {loading ? (
          <Loader message="Loading your complaints..." />
        ) : filteredComplaints.length > 0 ? (
          <div className="complaints-grid">
            {filteredComplaints.map(complaint => (
              <ComplaintCard
                key={complaint._id || complaint.id}
                complaint={complaint}
                onClick={() => navigate(`/complaint/${complaint._id || complaint.id}`)}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="no-data">
            {hasActiveFilters ? (
              <>
                <span className="no-data-icon" aria-hidden="true">🔍</span>
                <p>No complaints match your filters.</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setStatusFilter(''); setLocationFilter(''); }}
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <span className="no-data-icon" aria-hidden="true">🛣️</span>
                <p>You haven't submitted any complaints yet.</p>
                <Link to="/upload" className="btn btn-primary">Submit Your First Complaint</Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
