import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Plus, Edit3, Trash2, Search, Loader2, Save, X, RefreshCw, Upload } from 'lucide-react';
import { Contributor, getContributors, getAllContributorsAdmin, addContributor, updateContributor, deleteContributor } from '../../services/contributorService';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export const AdminContributors: React.FC = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contributorToDelete, setContributorToDelete] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState<Partial<Contributor>>({
    category: 'feature_contributor',
    name: '',
    role: '',
    image: '',
    bio: '',
    contributions: 0,
    badges: [],
    social_linkedin: '',
    social_instagram: '',
    social_github: '',
    is_approved: 1
  });
  
  const [badgeInput, setBadgeInput] = useState('');

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    setIsLoading(true);
    try {
      const data = await getAllContributorsAdmin();
      setContributors(data);
    } catch (err) {
      toast.error('Failed to load contributors');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImageToEndpoint = async (file: File): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
    // Reusing the news image upload endpoint as it uploads to Cloudinary generically
    const res = await fetch(`${API_URL}/api/news/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: uploadFormData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToEndpoint(file);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openForm = (contributor?: Contributor) => {
    if (contributor) {
      setEditingContributor(contributor);
      setFormData(contributor);
    } else {
      setEditingContributor(null);
      setFormData({
        category: 'feature_contributor',
        name: '',
        role: '',
        image: '',
        bio: '',
        contributions: 0,
        badges: [],
        social_linkedin: '',
        social_instagram: '',
        social_github: '',
        is_approved: 1
      });
    }
    setBadgeInput('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error('Name and Category are required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingContributor) {
        await updateContributor(editingContributor.id, formData);
        toast.success('Contributor updated');
      } else {
        await addContributor(formData);
        toast.success('Contributor added');
      }
      setIsFormOpen(false);
      fetchContributors();
    } catch (err) {
      toast.error('Failed to save contributor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!contributorToDelete) return;
    try {
      await deleteContributor(contributorToDelete);
      toast.success('Contributor deleted');
      setContributors(prev => prev.filter(c => c.id !== contributorToDelete));
    } catch (err) {
      toast.error('Failed to delete contributor');
    } finally {
      setIsDeleteModalOpen(false);
      setContributorToDelete(null);
    }
  };

  const addBadge = () => {
    if (!badgeInput.trim()) return;
    setFormData(prev => ({ ...prev, badges: [...(prev.badges || []), badgeInput.trim()] }));
    setBadgeInput('');
  };

  const removeBadge = (index: number) => {
    setFormData(prev => ({ ...prev, badges: prev.badges?.filter((_, i) => i !== index) }));
  };

  const toggleApproval = async (id: string, currentStatus: number) => {
    try {
      await updateContributor(id, { is_approved: currentStatus === 1 ? 0 : 1 });
      setContributors(prev => prev.map(c => c.id === id ? { ...c, is_approved: currentStatus === 1 ? 0 : 1 } : c));
      toast.success(currentStatus === 1 ? 'Hidden from public' : 'Visible to public');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredContributors = contributors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <Users className="w-7 h-7 text-brand-primary" />
            Contributors & Team
          </h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Manage the Core Team, Top Contributors, and Wall of Fame.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg shadow-brand-primary/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
              {editingContributor ? <Edit3 className="w-5 h-5 text-brand-primary" /> : <Plus className="w-5 h-5 text-brand-primary" />}
              {editingContributor ? 'Edit Member' : 'New Member'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category *</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-black uppercase tracking-widest">
                  <option value="core_team">Core Team</option>
                  <option value="feature_contributor">Feature Contributor</option>
                  <option value="resource_contributor">Resource Contributor</option>
                  <option value="wall_of_fame">Wall of Fame (Simple tag)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role / Title</label>
                <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium" placeholder="e.g. Founder, Notes Uploader" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Points / Contributions</label>
                <input type="number" value={formData.contributions} onChange={e => setFormData({...formData, contributions: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bio / Quote</label>
              <textarea rows={2} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none text-sm font-medium" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profile Image URL</label>
                  <div className="flex gap-2">
                    <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="Paste URL or upload..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                    <label className={`cursor-pointer shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${isUploadingImage ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-brand-surface border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20'}`}>
                      {isUploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <input type="file" accept="image/*" className="hidden" disabled={isUploadingImage} onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Badges (e.g. "Notes King", press Enter)</label>
                  <div className="flex gap-2">
                    <input type="text" value={badgeInput} onChange={e => setBadgeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBadge(); } }} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" placeholder="Type and add..." />
                    <button type="button" onClick={addBadge} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors">Add</button>
                  </div>
                  {formData.badges && formData.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.badges.map((badge, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-surface text-brand-primary text-xs font-bold">
                          {badge}
                          <button type="button" onClick={() => removeBadge(idx)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">LinkedIn URL</label>
                  <input type="url" value={formData.social_linkedin} onChange={e => setFormData({...formData, social_linkedin: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GitHub URL</label>
                  <input type="url" value={formData.social_github} onChange={e => setFormData({...formData, social_github: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram URL</label>
                  <input type="url" value={formData.social_instagram} onChange={e => setFormData({...formData, social_instagram: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || isUploadingImage} className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-brand-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingContributor ? 'Update Member' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredContributors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">No contributors found</td>
                </tr>
              ) : (
                filteredContributors.map(contributor => (
                  <tr key={contributor.id} className={`hover:bg-gray-50/50 transition-colors ${contributor.is_approved === 0 ? 'opacity-50 grayscale' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={contributor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.name}`} className="w-10 h-10 rounded-full bg-gray-100 object-cover" alt="" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{contributor.name}</p>
                          <p className="text-xs text-gray-500">{contributor.role || 'No role'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        contributor.category === 'core_team' ? 'bg-brand-surface text-brand-primary' :
                        contributor.category === 'feature_contributor' ? 'bg-blue-50 text-blue-600' :
                        contributor.category === 'resource_contributor' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-mark-soft text-mark-ink'
                      }`}>
                        {contributor.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-gray-700">{contributor.contributions}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleApproval(contributor.id, contributor.is_approved)}
                          className={`p-2 rounded-lg text-xs font-bold transition-colors ${contributor.is_approved ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          title={contributor.is_approved ? 'Hide' : 'Show'}
                        >
                          {contributor.is_approved ? 'Visible' : 'Hidden'}
                        </button>
                        <button onClick={() => openForm(contributor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setContributorToDelete(contributor.id); setIsDeleteModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setContributorToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Contributor"
        message="Are you sure you want to delete this contributor? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </motion.div>
  );
};
