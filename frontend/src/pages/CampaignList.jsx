import React, { useState, useEffect, useCallback } from 'react';
import './CampaignList.css';
import { campaignService } from '../services/campaignService';
import CampaignCard from '../components/CampaignCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
// Helper button for navigation
function CreateCampaignButton() {
  const navigate = useNavigate();
  return (
    <button
      className="btn btn-primary mt-3"
      onClick={() => navigate('/create-campaign')}
    >
      Create Campaign
    </button>
  );
}


const CATEGORIES = [
  'Technology',
  'Art',
  'Music',
  'Film',
  'Games',
  'Design',
  'Fashion',
  'Food',
  'Publishing',
  'Other'
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'deadline', label: 'Ending Soon' },
  { value: 'currentAmount', label: 'Most Funded' },
  { value: 'title', label: 'A-Z' }
];

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') || '');

  const fetchCampaigns = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 12,
        sort: sortBy,
        order: 'desc'
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const response = await campaignService.getAllCampaigns(params);
      
      setCampaigns(response.campaigns || response);
      setTotalPages(response.totalPages || Math.ceil((response.length || 0) / 12));
      setCurrentPage(page);

      // Update URL params
      const newSearchParams = new URLSearchParams();
      if (searchQuery) newSearchParams.set('search', searchQuery);
      if (selectedCategory) newSearchParams.set('category', selectedCategory);
      if (sortBy !== 'createdAt') newSearchParams.set('sort', sortBy);
      if (minAmount) newSearchParams.set('minAmount', minAmount);
      if (maxAmount) newSearchParams.set('maxAmount', maxAmount);
      if (page > 1) newSearchParams.set('page', page);
      
      setSearchParams(newSearchParams);

    } catch (err) {
      setError('Failed to load campaigns. Please try again.');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, sortBy, minAmount, maxAmount, setSearchParams]);

  useEffect(() => {
    fetchCampaigns(1);
  }, [searchQuery, selectedCategory, sortBy, minAmount, maxAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns(1);
  };

  const handlePageChange = (page) => {
    fetchCampaigns(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('createdAt');
    setMinAmount('');
    setMaxAmount('');
    setSearchParams({});
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Campaigns</h1>
        <div className="text-muted">
          {!loading && campaigns.length > 0 && `${campaigns.length} campaigns found`}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>

          <div className="grid grid-4 gap-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Min Amount ($)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Amount ($)</label>
              <input
                type="number"
                className="form-control"
                placeholder="1000000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {(searchQuery || selectedCategory || sortBy !== 'createdAt' || minAmount || maxAmount) && (
            <div className="mt-3">
              <button 
                type="button" 
                className="btn btn-outline btn-small"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner"></div>
          <p className="text-muted mt-3">Loading campaigns...</p>
        </div>
      )}

      {/* Campaign Grid */}
      {!loading && (
        <>
          {campaigns.length > 0 ? (
            <div className="grid grid-3">
              {campaigns.map(campaign => (
                <CampaignCard key={campaign._id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <h3 className="text-muted">No campaigns found</h3>
              <p className="text-muted">
                {searchQuery || selectedCategory || minAmount || maxAmount
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to create a campaign!'
                }
              </p>
              {(!searchQuery && !selectedCategory && !minAmount && !maxAmount) && (
                <CreateCampaignButton />
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <div className="d-flex gap-1">
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 2
                  ) {
                    return (
                      <button
                        key={page}
                        className={`btn btn-small ${page === currentPage ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
                
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampaignList;
