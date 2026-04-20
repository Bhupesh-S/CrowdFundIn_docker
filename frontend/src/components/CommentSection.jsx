import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commentService } from '../services/commentService';
import { toast } from 'react-hot-toast';
import './CommentSection.css';

const CommentSection = ({ campaignId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [campaignId, currentPage]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getCampaignComments(campaignId, {
        page: currentPage,
        limit: 10
      });
      setComments(response.comments || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await commentService.addComment({
        campaignId,
        content: newComment.trim()
      });
      setNewComment('');
      toast.success('Comment added successfully');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to reply');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      await commentService.addComment({
        campaignId,
        content: replyContent.trim(),
        parentComment: parentCommentId
      });
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply added successfully');
      fetchComments();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await commentService.updateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated successfully');
      fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(error.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
      toast.success('Comment deleted successfully');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like comments');
      return;
    }

    try {
      await commentService.likeComment(commentId);
      fetchComments(); // Refresh to show updated like count
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            {comment.author?.profilePicture ? (
              <img 
                src={`http://localhost:5000${comment.author.profilePicture}`}
                alt={comment.author.name}
              />
            ) : (
              <div className="avatar-placeholder">
                {comment.author?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{comment.author?.name || 'Anonymous'}</span>
            <span className="comment-date">
              {formatDate(comment.createdAt)}
              {comment.isEdited && <span className="edited-label">(edited)</span>}
            </span>
          </div>
        </div>
        
        <div className="comment-actions">
          {user && user.id === comment.author?._id && (
            <>
              <button 
                onClick={() => {
                  setEditingComment(comment._id);
                  setEditContent(comment.content);
                }}
                className="action-btn edit-btn"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button 
                onClick={() => handleDeleteComment(comment._id)}
                className="action-btn delete-btn"
              >
                <i className="fas fa-trash"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="comment-content">
        {editingComment === comment._id ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleEditComment(comment._id);
          }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              rows="3"
            />
            <div className="edit-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Save
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p>{comment.content}</p>
        )}
      </div>

      <div className="comment-footer">
        <button 
          onClick={() => handleLikeComment(comment._id)}
          className={`action-btn like-btn ${comment.isLiked ? 'liked' : ''}`}
          disabled={!isAuthenticated}
        >
          <i className="fas fa-heart"></i>
          <span>{comment.likeCount || 0}</span>
        </button>
        
        {!isReply && (
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Please log in to reply');
                return;
              }
              setReplyingTo(replyingTo === comment._id ? null : comment._id);
              setReplyContent('');
            }}
            className="action-btn reply-btn"
          >
            <i className="fas fa-reply"></i>
            Reply
          </button>
        )}
      </div>

      {replyingTo === comment._id && (
        <form 
          onSubmit={(e) => handleSubmitReply(e, comment._id)}
          className="reply-form"
        >
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="reply-textarea"
            rows="3"
            required
          />
          <div className="reply-actions">
            <button 
              type="submit" 
              disabled={submitting || !replyContent.trim()}
              className="btn btn-primary btn-sm"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem key={reply._id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="comment-section">
        <h3>Comments</h3>
        <div className="loading-comments">
          <div className="spinner"></div>
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>
      
      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="add-comment-form">
          <div className="comment-input-group">
            <div className="user-avatar">
              {user?.profilePicture ? (
                <img 
                  src={`http://localhost:5000${user.profilePicture}`}
                  alt={user.name}
                />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this campaign..."
              className="comment-textarea"
              rows="3"
              required
            />
          </div>
          <div className="comment-submit">
            <button 
              type="submit" 
              disabled={submitting || !newComment.trim()}
              className="btn btn-primary"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p>Please <a href="/login">log in</a> to leave a comment.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <i className="fas fa-comments"></i>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="comments-pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;