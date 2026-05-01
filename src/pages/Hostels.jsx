import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import HostelCard from '../components/HostelCard';
import { supabase } from '../lib/supabase';
import { Search, Filter, X, Loader2 } from 'lucide-react';

const Hostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    amenities: {
      ac: false,
      wifi: false,
      kitchen: false
    }
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      console.log("Fetching hostels from Supabase...");
      const { data, error } = await supabase
        .from('hostels')
        .select('*, rooms(*)');
      
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      console.log("Data received:", data);
      setHostels(data || []);
    } catch (err) {
      console.error("Fetch hostels error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHostels = useMemo(() => {
    return hostels.filter(hostel => {
      const matchesSearch = hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            hostel.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const prices = hostel.rooms?.map(r => r.price) || [0];
      const minPrice = Math.min(...prices);
      const matchesPrice = minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
      
      const hasAC = !filters.amenities.ac || hostel.rooms?.some(r => r.ac_available);
      const hasWifi = !filters.amenities.wifi || hostel.rooms?.some(r => r.wifi_available);
      const hasKitchen = !filters.amenities.kitchen || hostel.rooms?.some(r => r.kitchen_available);
      
      return matchesSearch && matchesPrice && hasAC && hasWifi && hasKitchen;
    });
  }, [hostels, searchTerm, filters]);

  const toggleAmenity = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  return (
    <div className="hostels-page">
      <section className="search-section">
        <div className="container">
          <div className="search-wrapper">
            <div className="search-bar glass-card">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Search by hostel name or location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={20} />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <motion.div 
              className="filters-panel glass-card animate-slide-up"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              <div className="filter-group">
                <h4>Amenities</h4>
                <div className="amenity-checks">
                  <label className={`check-btn ${filters.amenities.ac ? 'active' : ''}`}>
                    <input type="checkbox" onChange={() => toggleAmenity('ac')} /> AC Available
                  </label>
                  <label className={`check-btn ${filters.amenities.wifi ? 'active' : ''}`}>
                    <input type="checkbox" onChange={() => toggleAmenity('wifi')} /> WiFi
                  </label>
                  <label className={`check-btn ${filters.amenities.kitchen ? 'active' : ''}`}>
                    <input type="checkbox" onChange={() => toggleAmenity('kitchen')} /> Kitchen
                  </label>
                </div>
              </div>
              
              <div className="filter-actions">
                <button className="btn-clear" onClick={() => {
                  setFilters({ priceRange: [0, 10000], amenities: { ac: false, wifi: false, kitchen: false } });
                  setSearchTerm('');
                }}>Clear All</button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="results-section">
        <div className="container">
          <div className="results-header">
            <p>{filteredHostels.length} hostels found</p>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={48} />
              <p>Loading verified hostels...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3">
              {filteredHostels.map(hostel => (
                <HostelCard key={hostel.id} hostel={hostel} />
              ))}
            </div>
          )}

          {filteredHostels.length === 0 && (
            <div className="no-results glass-card">
              <h3>No hostels match your search</h3>
              <p>Try adjusting your filters or search term.</p>
              <button className="btn btn-primary" onClick={() => {
                setSearchTerm('');
                setFilters({ priceRange: [0, 10000], amenities: { ac: false, wifi: false, kitchen: false } });
              }}>Reset Everything</button>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .hostels-page { padding-bottom: 4rem; background: #f8fafc; min-height: 100vh; }
        .search-section { padding: 3rem 0; background: white; border-bottom: 1px solid var(--border); }
        .search-wrapper { max-width: 800px; margin: 0 auto; }
        .search-bar {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          gap: 1rem;
          border: 1px solid var(--border);
        }
        .search-icon { color: var(--text-muted); }
        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.125rem;
          padding: 0.75rem 0;
          background: transparent;
        }
        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          color: var(--text);
        }
        
        .filters-panel {
          max-width: 800px;
          margin: 1.5rem auto 0;
          padding: 1.5rem;
          background: white;
          overflow: hidden;
        }
        .filter-group h4 { margin-bottom: 1rem; font-size: 0.875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .amenity-checks { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .check-btn {
          cursor: pointer;
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .check-btn input { display: none; }
        .check-btn.active {
          background: #eff6ff;
          color: var(--primary);
          border-color: var(--primary);
        }
        .filter-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
        }
        .btn-clear {
          background: none;
          border: none;
          color: var(--error);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 0;
          color: var(--text-muted);
          gap: 1.5rem;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          color: var(--primary);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .results-section { padding: 3rem 0; }
        .results-header { margin-bottom: 2rem; color: var(--text-muted); }
        
        .no-results {
          padding: 4rem;
          text-align: center;
          max-width: 500px;
          margin: 4rem auto;
        }
        .no-results h3 { margin-bottom: 1rem; }
        .no-results p { color: var(--text-muted); margin-bottom: 2rem; }

        @media (max-width: 768px) {
          .grid-cols-3 { grid-template-columns: 1fr; }
          .filter-toggle span { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Hostels;
