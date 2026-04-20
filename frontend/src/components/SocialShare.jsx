import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import './SocialShare.css';

const SocialShare = ({ campaign }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  if (!campaign) return null;

  const shareUrl = `${window.location.origin}/campaigns/${campaign._id}`;
  const shareTitle = campaign.title;
  const shareDescription = campaign.description.substring(0, 200) + '...';
  const shareImage = campaign.image ? `${window.location.origin}${campaign.image}` : '';

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: 'fab fa-facebook-f',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: '#1877F2'
    },
    {
      name: 'Twitter',
      icon: 'fab fa-twitter',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle + ' - Support this amazing campaign!')}`,
      color: '#1DA1F2'
    },
    {
      name: 'LinkedIn',
      icon: 'fab fa-linkedin-in',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: '#0077B5'
    },
    {
      name: 'WhatsApp',
      icon: 'fab fa-whatsapp',
      url: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' - ' + shareUrl)}`,
      color: '#25D366'
    },
    {
      name: 'Telegram',
      icon: 'fab fa-telegram-plane',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      color: '#0088CC'
    },
    {
      name: 'Reddit',
      icon: 'fab fa-reddit-alien',
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
      color: '#FF4500'
    }
  ];

  const handleShare = (platform) => {
    if (navigator.share && platform.name === 'Native') {
      navigator.share({
        title: shareTitle,
        text: shareDescription,
        url: shareUrl
      }).catch(console.error);
    } else {
      window.open(platform.url, '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <>
      <div className="social-share-container">
        <button 
          onClick={() => setShowShareModal(true)}
          className="share-btn"
          title="Share this campaign"
        >
          <i className="fas fa-share-alt"></i>
          <span>Share</span>
        </button>

        {/* Quick share buttons */}
        <div className="quick-share-buttons">
          {socialPlatforms.slice(0, 3).map((platform) => (
            <button
              key={platform.name}
              onClick={() => handleShare(platform)}
              className="quick-share-btn"
              style={{ backgroundColor: platform.color }}
              title={`Share on ${platform.name}`}
            >
              <i className={platform.icon}></i>
            </button>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share this Campaign</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="close-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="share-modal-content">
              <div className="campaign-preview">
                <div className="campaign-preview-image">
                  {campaign.image ? (
                    <img 
                      src={`http://localhost:5000${campaign.image}`}
                      alt={campaign.title}
                    />
                  ) : (
                    <div className="placeholder-image">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                </div>
                <div className="campaign-preview-info">
                  <h4>{campaign.title}</h4>
                  <p>{shareDescription}</p>
                  <div className="campaign-stats">
                    <span className="raised-amount">
                      ${campaign.currentAmount?.toLocaleString() || 0} raised
                    </span>
                    <span className="goal-amount">
                      of ${campaign.goalAmount?.toLocaleString()} goal
                    </span>
                  </div>
                </div>
              </div>

              <div className="share-options">
                <h4>Share on social media</h4>
                <div className="social-platforms">
                  {socialPlatforms.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => handleShare(platform)}
                      className="social-platform-btn"
                      style={{ '--platform-color': platform.color }}
                    >
                      <i className={platform.icon}></i>
                      <span>{platform.name}</span>
                    </button>
                  ))}
                </div>

                {/* Native Share (if supported) */}
                {navigator.share && (
                  <button
                    onClick={() => handleShare({ name: 'Native' })}
                    className="social-platform-btn native-share"
                  >
                    <i className="fas fa-share-alt"></i>
                    <span>More options</span>
                  </button>
                )}
              </div>

              <div className="copy-link-section">
                <h4>Or copy link</h4>
                <div className="copy-link-container">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="link-input"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="copy-btn"
                  >
                    <i className="fas fa-copy"></i>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialShare;