import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Award, BookOpen, Save, Edit2, X, Plus, CheckCircle, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const Profile = () => {
  const { auth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    experienceYears: 0,
    education: '',
    skills: [],
    linkedinUrl: '',
    githubUrl: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/candidate/profile`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          experienceYears: data.experience_years || 0,
          education: data.education || '',
          skills: data.skills || [],
          linkedinUrl: data.linkedin_url || '',
          githubUrl: data.github_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (auth?.token) fetchProfile();
  }, [auth?.token]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/candidate/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          phone: profileData.phone,
          skills: profileData.skills,
          experienceYears: Number(profileData.experienceYears),
          education: profileData.education,
          linkedinUrl: profileData.linkedinUrl,
          githubUrl: profileData.githubUrl
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
    setSaving(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold">Authentication Required</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary dark:text-dark-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-dark-primary">My Profile</h1>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isEditing ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30' : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
          </button>
        </div>

        <AnimatePresence>
          {saveSuccess && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-medium">Profile updated successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl border border-secondary/30 dark:border-dark-secondary/30 p-6 sm:p-8">
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <p className="text-lg font-semibold">{profileData.name}</p>
                <p className="text-xs text-gray-400 mt-1">Name cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
                <p className="text-lg font-semibold">{profileData.email}</p>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> Phone Number</label>
                {isEditing ? (
                  <input type="tel" name="phone" value={profileData.phone} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg bg-background border border-secondary/30 focus:ring-2 focus:ring-primary outline-none" />
                ) : <p>{profileData.phone || '—'}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Award className="w-4 h-4" /> Experience (Years)</label>
                {isEditing ? (
                  <input type="number" name="experienceYears" value={profileData.experienceYears} onChange={handleInputChange} min="0" className="w-full px-4 py-2 rounded-lg bg-background border border-secondary/30 focus:ring-2 focus:ring-primary outline-none" />
                ) : <p>{profileData.experienceYears || 0} years</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Education</label>
              {isEditing ? (
                <input type="text" name="education" value={profileData.education} onChange={handleInputChange} placeholder="e.g., B.S. in Computer Science" className="w-full px-4 py-2 rounded-lg bg-background border border-secondary/30 focus:ring-2 focus:ring-primary outline-none" />
              ) : <p>{profileData.education || '—'}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">LinkedIn URL</label>
                {isEditing ? (
                  <input type="url" name="linkedinUrl" value={profileData.linkedinUrl} onChange={handleInputChange} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2 rounded-lg bg-background border border-secondary/30 focus:ring-2 focus:ring-primary outline-none" />
                ) : <p className="text-blue-500 break-all">{profileData.linkedinUrl || '—'}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">GitHub URL</label>
                {isEditing ? (
                  <input type="url" name="githubUrl" value={profileData.githubUrl} onChange={handleInputChange} placeholder="https://github.com/..." className="w-full px-4 py-2 rounded-lg bg-background border border-secondary/30 focus:ring-2 focus:ring-primary outline-none" />
                ) : <p className="text-blue-500 break-all">{profileData.githubUrl || '—'}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Skills</label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.length === 0 && !isEditing && <p className="text-sm text-gray-500">No skills added</p>}
                  {profileData.skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                      <span className="text-sm font-medium">{skill}</span>
                      {isEditing && <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} placeholder="Add a skill (press Enter)" className="flex-1 px-4 py-2 rounded-lg bg-background border border-secondary/30 outline-none focus:ring-2 focus:ring-primary" />
                    <button onClick={handleAddSkill} className="px-4 py-2 rounded-lg bg-secondary/20 text-text hover:bg-secondary/30 font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <button onClick={handleSaveProfile} disabled={saving} className="w-full mt-8 px-6 py-3 rounded-lg bg-primary text-white hover:opacity-90 transition-all font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;