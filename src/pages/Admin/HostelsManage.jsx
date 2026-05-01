import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, ShieldCheck, 
  Search, Filter, ChevronRight, X, 
  Camera, MapPin, Phone, MessageCircle, Loader2,
  DollarSign, Users, Bath, Wind, Wifi, Utensils,
  Video, Globe, Users2, Navigation, Info, Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const HostelsManage = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'media', 'rooms'
  
  // Advanced State for Complex Form
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    contact_type: 'both',
    contact_value: '',
    gender_type: 'mixed',
    distance_from_gate: '',
    video_url: '',
    map_url: '',
    images: [],
    rooms: []
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      const { data, error } = await supabase
        .from('hostels')
        .select('*, rooms(*)');
      if (error) throw error;
      setHostels(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hostel = null) => {
    setActiveTab('basic');
    if (hostel) {
      setFormData({
        name: hostel.name,
        location: hostel.location,
        description: hostel.description || '',
        contact_type: hostel.contact_type,
        contact_value: hostel.contact_value || '',
        gender_type: hostel.gender_type || 'mixed',
        distance_from_gate: hostel.distance_from_gate || '',
        video_url: hostel.video_url || '',
        map_url: hostel.map_url || '',
        images: hostel.images || [],
        rooms: hostel.rooms || []
      });
      setEditingId(hostel.id);
    } else {
      setFormData({
        name: '',
        location: '',
        description: '',
        contact_type: 'both',
        contact_value: '',
        gender_type: 'mixed',
        distance_from_gate: '',
        video_url: '',
        map_url: '',
        images: [],
        rooms: []
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [...formData.rooms, { 
        room_label: '', 
        price: '', 
        occupancy: 1, 
        bathroom_type: 'ensuite',
        ac_available: false,
        wifi_available: true,
        kitchen_available: false,
        generator_available: false,
        borehole_available: true,
        security_available: true,
        laundry_available: false,
        study_desk_available: true
      }]
    });
  };

  const updateRoom = (index, field, value) => {
    const newRooms = [...formData.rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setFormData({ ...formData, rooms: newRooms });
  };

  const removeRoom = (index) => {
    setFormData({ ...formData, rooms: formData.rooms.filter((_, i) => i !== index) });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSubmitting(true);
    const newImages = [...formData.images];
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `listing-images/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('hostels').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('hostels').getPublicUrl(filePath);
        newImages.push(publicUrl);
      } catch (err) { alert("Upload failed: " + err.message); }
    }
    setFormData({ ...formData, images: newImages });
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    console.group("🚀 Hostel Submission Started");
    try {
      const hostelData = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        contact_type: formData.contact_type,
        contact_value: formData.contact_value,
        gender_type: formData.gender_type,
        distance_from_gate: formData.distance_from_gate,
        video_url: formData.video_url,
        map_url: formData.map_url,
        images: formData.images,
        verification_status: 'verified'
      };

      console.log("1. Saving Hostel Metadata:", hostelData);
      let hostelId = editingId;
      if (editingId) {
        const { error: hError } = await supabase.from('hostels').update(hostelData).eq('id', editingId);
        if (hError) throw hError;
        console.log("2. Cleaning old room variants...");
        await supabase.from('rooms').delete().eq('hostel_id', editingId);
      } else {
        const { data: newHostel, error: hError } = await supabase.from('hostels').insert([hostelData]).select().single();
        if (hError) throw hError;
        hostelId = newHostel.id;
        console.log("2. New Hostel Created ID:", hostelId);
      }

      if (formData.rooms.length > 0) {
        console.log("3. Syncing", formData.rooms.length, "Room Variants...");
        const roomsToInsert = formData.rooms.map(r => ({ ...r, hostel_id: hostelId, id: undefined }));
        const { error: rError } = await supabase.from('rooms').insert(roomsToInsert);
        if (rError) throw rError;
      }

      console.log("✅ Sync Complete!");
      setIsModalOpen(false);
      fetchHostels();
      alert("Hostel Published Successfully!");
    } catch (err) { 
      console.error("❌ Submission Failed:", err);
      alert("Save failed: " + err.message); 
    }
    finally { 
      setSubmitting(false); 
      console.groupEnd();
    }
  };

  const filteredHostels = hostels.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-view animate-fade-in">
      <div className="view-header">
        <div className="header-text">
          <h1>Hostel Inventory</h1>
          <p>Easily manage listings, photos, and room variants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add New Hostel
        </button>
      </div>

      <div className="toolbar glass-card">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search hostels..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hostel-table-wrapper card">
        {loading ? <div className="loading-state"><Loader2 className="animate-spin" /></div> : (
          <table>
            <thead>
              <tr>
                <th>Hostel Details</th>
                <th>Category</th>
                <th>Distance</th>
                <th>Variants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHostels.map(h => (
                <tr key={h.id}>
                  <td>
                    <div className="cell-hostel">
                      <img src={h.images?.[0] || 'https://via.placeholder.com/150'} alt="" className="mini-thumb" />
                      <div>
                        <div className="fw-600">{h.name}</div>
                        <div className="text-muted fs-xs">{h.location}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`gender-tag ${h.gender_type}`}>{h.gender_type}</span></td>
                  <td><span className="dist-tag"><Navigation size={12}/> {h.distance_from_gate || 'N/A'}</span></td>
                  <td><span className="badge-outline">{h.rooms?.length || 0} types</span></td>
                  <td>
                    <div className="action-row">
                      <button className="icon-btn edit" onClick={() => handleOpenModal(h)}><Edit2 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => {/* Delete Logic */}}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content-tabs glass-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header-tabs">
                <div className="header-top">
                  <h2>{editingId ? 'Edit Listing' : 'New Hostel Listing'}</h2>
                  <button className="close-btn" onClick={() => setIsModalOpen(false)}><X /></button>
                </div>
                <div className="tab-nav">
                  <button className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
                    <Info size={16} /> Basic Info
                  </button>
                  <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
                    <Camera size={16} /> Gallery & Social
                  </button>
                  <button className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
                    <Building2 size={16} /> Room Variants
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="tab-form-body">
                <div className="tab-content">
                  {activeTab === 'basic' && (
                    <div className="form-section-tab animate-slide-in">
                      <div className="field-grid">
                        <div className="field full">
                          <label>Hostel Name</label>
                          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Diamond Hostel" />
                        </div>
                        <div className="field">
                          <label>Exact Location</label>
                          <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Near GCTU Main Gate" />
                        </div>
                        <div className="field">
                          <label>Student Category</label>
                          <select value={formData.gender_type} onChange={e => setFormData({...formData, gender_type: e.target.value})}>
                            <option value="mixed">Mixed (All Students)</option>
                            <option value="male">Male Only</option>
                            <option value="female">Female Only</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Distance from Gate</label>
                          <input value={formData.distance_from_gate} onChange={e => setFormData({...formData, distance_from_gate: e.target.value})} placeholder="e.g. 5 mins walk" />
                        </div>
                        <div className="field">
                          <label>Contact Number</label>
                          <input value={formData.contact_value} onChange={e => setFormData({...formData, contact_value: e.target.value})} placeholder="024 XXX XXXX" />
                        </div>
                        <div className="field full">
                          <label>Hostel Description</label>
                          <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'media' && (
                    <div className="form-section-tab animate-slide-in">
                      <div className="field-grid">
                        <div className="field full">
                          <label><Video size={14}/> Video Tour URL (YouTube)</label>
                          <input value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} placeholder="https://youtube.com/watch?v=..." />
                        </div>
                        <div className="field full">
                          <label><Globe size={14}/> Google Maps Location URL</label>
                          <input value={formData.map_url} onChange={e => setFormData({...formData, map_url: e.target.value})} placeholder="https://maps.app.goo.gl/..." />
                        </div>
                      </div>
                      
                      <div className="media-upload-section">
                        <label>Hostel Photos</label>
                        <div className="image-manager-grid">
                          {formData.images.map((img, i) => (
                            <div key={i} className="img-box">
                              <img src={img} alt="" />
                              <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="img-del"><X size={12} /></button>
                            </div>
                          ))}
                          <label className="add-img-btn">
                            <Plus size={24} />
                            <span>Upload Photos</span>
                            <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'rooms' && (
                    <div className="form-section-tab animate-slide-in">
                      <div className="section-header-flex">
                        <p>Define the different room types and their costs.</p>
                        <button type="button" className="btn btn-sm btn-outline" onClick={addRoom}><Plus size={14}/> Add New Room Type</button>
                      </div>
                      
                      <div className="rooms-stack">
                        {formData.rooms.map((room, i) => (
                          <div key={i} className="room-card-mini card">
                            <div className="room-header">
                              <input placeholder="Room Type (e.g. 2 in a room)" value={room.room_label} onChange={e => updateRoom(i, 'room_label', e.target.value)} />
                              <button type="button" onClick={() => removeRoom(i)} className="text-red"><Trash2 size={16}/></button>
                            </div>
                            <div className="room-params">
                              <div className="mini-input">
                                <label>Price (GHS)</label>
                                <input type="number" value={room.price} onChange={e => updateRoom(i, 'price', e.target.value)} />
                              </div>
                              <div className="mini-input">
                                <label>Spaces</label>
                                <input type="number" value={room.occupancy} onChange={e => updateRoom(i, 'occupancy', e.target.value)} />
                              </div>
                              <div className="mini-input">
                                <label>Bath</label>
                                <select value={room.bathroom_type} onChange={e => updateRoom(i, 'bathroom_type', e.target.value)}>
                                  <option value="ensuite">Ensuite</option>
                                  <option value="shared">Shared</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                        {formData.rooms.length === 0 && <div className="empty-rooms">No room types added yet.</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="tab-footer">
                  <div className="tab-hints">
                    {activeTab === 'basic' && <span>Fill in the foundation of the listing.</span>}
                    {activeTab === 'media' && <span>Showcase the hostel visually.</span>}
                    {activeTab === 'rooms' && <span>Set your variants and pricing.</span>}
                  </div>
                  <div className="footer-btns">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? <Loader2 className="animate-spin" /> : (editingId ? 'Save Changes' : 'Publish Hostel')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-content-tabs { width: 95%; max-width: 800px; background: white; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
        .modal-header-tabs { background: #f8fafc; border-bottom: 1px solid var(--border); padding: 1.5rem 2rem 0; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .tab-nav { display: flex; gap: 1.5rem; }
        .tab-btn { background: none; border: none; padding: 0.75rem 0.25rem; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; position: relative; }
        .tab-btn.active { color: var(--primary); }
        .tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; }

        .tab-form-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .tab-content { padding: 2rem; flex: 1; }
        .form-section-tab { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .field.full { grid-column: span 2; }
        .field label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted); }
        .field input, .field select, .field textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; outline: none; transition: border-color 0.2s; }
        .field input:focus { border-color: var(--primary); }

        .image-manager-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .img-box { height: 110px; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid var(--border); }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .img-del { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .rooms-stack { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
        .room-card-mini { padding: 1rem; background: #f8fafc; border: 1px solid var(--border); }
        .room-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .room-header input { background: transparent; border: none; border-bottom: 1px solid var(--border); font-weight: 700; outline: none; flex: 1; }
        .room-params { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .mini-input label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .mini-input input, .mini-input select { width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.875rem; }

        .tab-footer { padding: 1.5rem 2rem; border-top: 1px solid var(--border); background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
        .tab-hints { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
        .footer-btns { display: flex; gap: 1rem; }

        .gender-tag { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
        .gender-tag.male { background: #eff6ff; color: #2563eb; }
        .gender-tag.female { background: #fff1f2; color: #e11d48; }
        .gender-tag.mixed { background: #f0fdf4; color: #16a34a; }
        .dist-tag { font-size: 0.8125rem; display: flex; align-items: center; gap: 4px; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default HostelsManage;
