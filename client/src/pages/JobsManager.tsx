import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Briefcase, MapPin, DollarSign, ListTodo, Gift } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string | null;
  status: string;
  requirements: string[];
  benefits: string[];
  createdAt: string;
}

export const JobsManager: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('FULL_TIME');
  const [salaryRange, setSalaryRange] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [benefitsInput, setBenefitsInput] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs/admin/all');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      } else {
        setError('Failed to fetch jobs.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setDescription('');
    setDepartment('');
    setLocation('');
    setType('FULL_TIME');
    setSalaryRange('');
    setStatus('DRAFT');
    setRequirementsInput('');
    setBenefitsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setDescription(job.description);
    setDepartment(job.department);
    setLocation(job.location);
    setType(job.type);
    setSalaryRange(job.salaryRange || '');
    setStatus(job.status);
    setRequirementsInput(job.requirements.join('\n'));
    setBenefitsInput(job.benefits.join('\n'));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job? All applications tied to this job will lose their connection.')) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
      } else {
        alert('Failed to delete job.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred during deletion.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Process requirements and benefits text area to array
    const requirements = requirementsInput
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const benefits = benefitsInput
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    if (requirements.length === 0) {
      setError('Please specify at least one job requirement.');
      return;
    }

    const payload = {
      title,
      description,
      department,
      location,
      type,
      salaryRange: salaryRange || null,
      status,
      requirements,
      benefits,
    };

    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = editingJob ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchJobs();
      } else {
        setError(data.errors ? data.errors.join(', ') : (data.message || 'Operation failed'));
      }
    } catch (err) {
      console.error(err);
      setError('Network error, please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Job Listings</h2>
          <p className="text-sm text-slate-400 mt-1">Create, edit, or archive job postings for your consultancy</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-600/10"
        >
          <Plus size={16} />
          Create Job
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Jobs list / table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <Briefcase size={40} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No jobs posted</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">Get started by creating your first job listing which candidates can view and apply for.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">Title & Dept</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Job Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/10 group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300 align-middle">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <MapPin size={14} />
                        {job.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                        {job.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        job.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' :
                        job.status === 'CLOSED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Job"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Job"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Slide-over / Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl h-screen bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-white">{editingJob ? 'Edit Job Listing' : 'Create Job Listing'}</h3>
                <p className="text-xs text-slate-400 mt-1">Fill out the fields to publish or save the job opening</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Senior React Developer"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering / Sales"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                      <MapPin size={14} />
                    </span>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Mumbai, India (Remote)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Salary Range (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                      <DollarSign size={14} />
                    </span>
                    <input
                      type="text"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="₹8,00,000 - ₹12,00,000"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Post Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the role, day-to-day operations, and expectations..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ListTodo size={13} />
                  Requirements (One per line)
                </label>
                <textarea
                  value={requirementsInput}
                  onChange={(e) => setRequirementsInput(e.target.value)}
                  placeholder="5+ years of Javascript experience&#10;B.Tech in Computer Science&#10;Strong communication skills"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Gift size={13} />
                  Benefits (One per line)
                </label>
                <textarea
                  value={benefitsInput}
                  onChange={(e) => setBenefitsInput(e.target.value)}
                  placeholder="Health Insurance&#10;Remote working options&#10;Annual Placements bonuses"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none transition-colors resize-none"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-brand-600/10"
              >
                {editingJob ? 'Save Changes' : 'Publish Job'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
