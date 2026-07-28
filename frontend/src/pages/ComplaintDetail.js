import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintService, resolveImageUrl } from '../services/api';
import { formatDate } from '../utils/formatDate';
import ComplaintLocationMap from '../components/ComplaintLocationMap';
import Loader from '../components/Loader';

const STATUS_CLASS = {
  Pending: 'status-pending',
  'In Progress': 'status-in-progress',
  Resolved: 'status-resolved'
};

const CATEGORY_ICON = {
  Pothole: '🕳️',
  Waterlogging: '💧',
  'Broken Streetlight': '💡',
  'Road Crack': '🛣️',
  'Missing Signage': '🚧',
  'Garbage Dump': '🗑️',
  Other: '📌'
};

const shortId = (id) => (id ? String(id).slice(-6).toUpperCase() : '------');

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await complaintService.getComplaintById(id);
        setComplaint(res.complaint || null);
      } catch (err) {
        console.error('fetch complaint detail', err);
        // if backend returns unauthorized/forbidden, send user back to dashboard
        if (err.status === 401 || err.status === 403) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load complaint');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) return <Loader message="Loading complaint details..." />;

  if (error) {
    return (
      <div className="complaint-detail-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="complaint-detail-page">
        <div className="no-data"><p>Complaint not found.</p></div>
      </div>
    );
  }

  const complaintId = complaint._id || complaint.id;
  const category = complaint.category || 'Other';
  const statusClass = STATUS_CLASS[complaint.status] || 'status-pending';
  const imageUrl = resolveImageUrl(complaint.image);
  const hasUpdate = complaint.updatedAt && complaint.updatedAt !== complaint.createdAt;

  return (
    <div className="complaint-detail-page">
      <button className="btn btn-secondary detail-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      <div className="detail-hero">
        <span className={`status-badge ${statusClass}`}>{complaint.status}</span>
        <h1>Complaint <span className="detail-id">#{shortId(complaintId)}</span></h1>
        <p className="detail-full-id">Reference ID: {complaintId}</p>

        <div className="complaint-card-tags">
          <span className="tag tag-category">{CATEGORY_ICON[category] || CATEGORY_ICON.Other} {category}</span>
          {complaint.severity && (
            <span className={`tag tag-severity tag-severity-${complaint.severity.toLowerCase()}`}>
              {complaint.severity} severity
            </span>
          )}
          {complaint.flags && (
            <span className="tag tag-flag">⚠ {complaint.flags}</span>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-card">
            <h3>Description</h3>
            <p className="detail-description">{complaint.description || 'No description provided.'}</p>
          </div>

          {imageUrl && (
            <div className="detail-card">
              <h3>Photo Evidence</h3>
              <div className="detail-photo-frame">
                <img src={imageUrl} alt="Reported road issue" className="detail-photo" />
              </div>
            </div>
          )}
        </div>

        <div className="detail-side">
          <div className="detail-card">
            <h3>Timeline</h3>
            <ul className="detail-timeline">
              <li>
                <span className="timeline-dot" />
                <div>
                  <strong>Complaint submitted</strong>
                  <span>{formatDate(complaint.createdAt)}</span>
                </div>
              </li>
              {hasUpdate && (
                <li>
                  <span className="timeline-dot timeline-dot-active" />
                  <div>
                    <strong>Status updated to {complaint.status}</strong>
                    <span>{formatDate(complaint.updatedAt)}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="detail-card detail-map-card">
        <h3>Location</h3>
        <p className="detail-location-line">📍 {complaint.location || 'Not specified'}</p>
        <ComplaintLocationMap
          path={complaint.path}
          routePath={complaint.routePath}
          lat={Number(complaint.lat ?? complaint.latitude)}
          lng={Number(complaint.lng ?? complaint.longitude)}
          height={320}
        />
      </div>
    </div>
  );
};

export default ComplaintDetail;
