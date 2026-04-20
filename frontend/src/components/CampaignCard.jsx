import React from 'react';
import { Link } from 'react-router-dom';
import './CampaignCard.css';
import { formatCurrency, getDaysRemaining, getProgressPercentage, truncateText, getInitials, getRandomColor } from '../utils/helpers';
import ProgressBar from './ProgressBar';

const CampaignCard = ({ campaign }) => {
  const {
    _id,
    title,
    description,
    image,
    currentAmount = 0,
    goalAmount,
    deadline,
    owner,
    category
  } = campaign;

  const daysRemaining = getDaysRemaining(deadline);
  const progressPercentage = getProgressPercentage(currentAmount, goalAmount);
  const isExpired = daysRemaining === 0;

  return (
    <div className="card">
      <Link to={`/campaigns/${_id}`} className="text-decoration-none">
        <div 
          className="campaign-image"
          style={{
            height: '200px',
            backgroundImage: image ? `url(http://localhost:5000${image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          {category && (
            <span className="badge badge-primary" style={{
              position: 'absolute',
              top: '12px',
              left: '12px'
            }}>
              {category}
            </span>
          )}
          {isExpired && (
            <span className="badge badge-danger" style={{
              position: 'absolute',
              top: '12px',
              right: '12px'
            }}>
              Expired
            </span>
          )}
        </div>
      </Link>

      <div className="card-body">
        <Link to={`/campaigns/${_id}`} className="text-decoration-none">
          <h3 className="card-title">{title}</h3>
        </Link>
        
        <p className="card-text text-muted">
          {truncateText(description, 120)}
        </p>

        <div className="mb-3">
          <ProgressBar current={currentAmount} goal={goalAmount} />
          <div className="d-flex justify-content-between mt-1">
            <small className="text-muted">{progressPercentage.toFixed(1)}% funded</small>
            <small className="text-muted">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </small>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div className="text-primary font-weight-bold">
              {formatCurrency(currentAmount)}
            </div>
            <small className="text-muted">raised of {formatCurrency(goalAmount)}</small>
          </div>
        </div>

        <div className="d-flex align-items-center">
          <div 
            className="avatar avatar-sm"
            style={{ backgroundColor: getRandomColor() }}
          >
            {owner?.profileImage ? (
              <img 
                src={owner.profileImage} 
                alt={owner.name || owner.username} 
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              getInitials(owner?.name || owner?.username || 'Anonymous')
            )}
          </div>
          <div style={{ marginLeft: '8px' }}>
            <small className="text-muted">by</small>
            <div className="font-weight-medium">
              {owner?.name || owner?.username || 'Anonymous'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
