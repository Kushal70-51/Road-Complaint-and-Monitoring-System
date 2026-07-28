import React from 'react';
import { formatDate, getRelativeTime } from '../utils/formatDate';
import { resolveImageUrl } from '../services/api';

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

const ComplaintCard = ({ complaint, onClick }) => {
  const id = complaint._id || complaint.id;
  const category = complaint.category || 'Other';
  const statusClass = STATUS_CLASS[complaint.status] || 'status-pending';
  const imageUrl = resolveImageUrl(complaint.image);

  return (
    <div className="complaint-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="complaint-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={category} loading="lazy" />
        ) : (
          <span className="complaint-card-media-fallback" aria-hidden="true">
            {CATEGORY_ICON[category] || CATEGORY_ICON.Other}
          </span>
        )}
        <span className={`status-badge ${statusClass} complaint-card-status`}>
          {complaint.status}
        </span>
      </div>

      <div className="complaint-card-body">
        <div className="complaint-header">
          <h3 title={id}>Complaint #{shortId(id)}</h3>
        </div>

        <div className="complaint-card-tags">
          <span className="tag tag-category">{CATEGORY_ICON[category] || CATEGORY_ICON.Other} {category}</span>
          {complaint.severity && (
            <span className={`tag tag-severity tag-severity-${complaint.severity.toLowerCase()}`}>
              {complaint.severity}
            </span>
          )}
        </div>

        {complaint.description && (
          <p className="complaint-card-description">{complaint.description}</p>
        )}

        <div className="complaint-body">
          <p className="complaint-location">📍 {complaint.location || 'Location not specified'}</p>
          <p className="complaint-date" title={formatDate(complaint.createdAt)}>
            📅 {getRelativeTime(complaint.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
