import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Download, Trash2, X, Phone, Mail, FileText, CheckCircle2, Users } from 'lucide-react';

interface Job {
  id: string;
  title: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumePath: string;
  coverLetter: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  jobId: string | null;
  job?: {
    title: string;
  };
}

export const CandidatesManager: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');

  // Details Modal states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedNotes, setSelectedNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (jobFilter) queryParams.append('jobId', jobFilter);

      const res = await fetch(`/api/candidates?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs/admin/all');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, statusFilter, jobFilter]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const openDetailsModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSelectedStatus(candidate.status);
    setSelectedNotes(candidate.notes || '');
  };

  const closeDetailsModal = () => {
    setSelectedCandidate(null);
  };

  const handleUpdateStatusAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      setUpdating(true);

      // 1. Update status
      const statusRes = await fetch(`/api/candidates/${selectedCandidate.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      // 2. Update notes
      const notesRes = await fetch(`/api/candidates/${selectedCandidate.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: selectedNotes }),
      });

      if (statusRes.ok && notesRes.ok) {
        alert('Candidate details updated successfully.');
        closeDetailsModal();
        fetchCandidates();
      } else {
        alert('Failed to update candidate details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating candidate details.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this candidate application and delete their resume from the server disk? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCandidates(candidates.filter(c => c.id !== id));
        if (selectedCandidate && selectedCandidate.id === id) {
          closeDetailsModal();
        }
      } else {
        alert('Failed to delete candidate.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred during deletion.');
    }
  };

  const handleDownload = (candidateId: string) => {
    // Standard file download trigger via browser endpoint redirect
    window.open(`/api/candidates/${candidateId}/resume`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Manage Candidates</h2>
        <p className="text-sm text-slate-400 mt-1">Review applications, read resumes, schedule updates, and record notes</p>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:outline-none transition-colors"
          />
        </div>

        {/* Job filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Filter size={14} />
          </span>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:outline-none transition-colors cursor-pointer appearance-none"
          >
            <option value="">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Filter size={14} />
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:outline-none transition-colors cursor-pointer appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="APPLIED">Applied (New)</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEWED">Interviewed</option>
            <option value="REJECTED">Rejected</option>
            <option value="HIRED">Hired</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <Users className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-base font-semibold text-white">No candidates found</h3>
          <p className="text-sm text-slate-400 mt-1">No candidate records match your current filter parameters.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Job Applied</th>
                  <th className="px-6 py-4">Date Applied</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/10 group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300 align-middle">
                      {c.job?.title || <span className="text-slate-500 italic">General Candidate</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 align-middle">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        c.status === 'APPLIED' ? 'bg-blue-500/10 text-blue-400' :
                        c.status === 'SHORTLISTED' ? 'bg-cyan-500/10 text-cyan-400' :
                        c.status === 'INTERVIEWED' ? 'bg-yellow-500/10 text-yellow-400' :
                        c.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                        c.status === 'HIRED' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(c)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(c.id)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="Download Resume"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Candidate"
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

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-white">Application Details</h3>
                <span className="text-xs text-slate-400 mt-1">Submitted on {new Date(selectedCandidate.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <button 
                onClick={closeDetailsModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/30 p-4 border border-slate-800/80 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Candidate Name</span>
                  <p className="text-white font-semibold mt-0.5">{selectedCandidate.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Applied Position</span>
                  <p className="text-brand-400 font-semibold mt-0.5">{selectedCandidate.job?.title || 'General Submission'}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                  <Mail size={14} className="text-slate-500" />
                  <a href={`mailto:${selectedCandidate.email}`} className="hover:underline">{selectedCandidate.email}</a>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                  <Phone size={14} className="text-slate-500" />
                  <a href={`tel:${selectedCandidate.phone}`} className="hover:underline">{selectedCandidate.phone}</a>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedCandidate.coverLetter && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Cover Letter Message</span>
                  <div className="bg-slate-950/20 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedCandidate.coverLetter}
                  </div>
                </div>
              )}

              {/* Resume File */}
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-rose-500/10 text-rose-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Curriculum Vitae / Resume</p>
                    <p className="text-xs text-slate-500 mt-0.5">Stored locally on server</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedCandidate.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  <Download size={13} />
                  Download File
                </button>
              </div>

              {/* Admin Updates form */}
              <form onSubmit={handleUpdateStatusAndNotes} className="space-y-4 pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Application Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="APPLIED">Applied (New)</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEWED">Interviewed</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="HIRED">Hired</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recruiter Notes (Internal only)</label>
                  <textarea
                    value={selectedNotes}
                    onChange={(e) => setSelectedNotes(e.target.value)}
                    placeholder="Enter candidate details, test results, scheduling information..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Submit inside modal */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedCandidate.id)}
                    className="flex items-center gap-1.5 px-4 py-2 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 font-semibold text-xs rounded-lg transition-colors border border-transparent hover:border-rose-500/20 mr-auto"
                  >
                    <Trash2 size={13} />
                    Delete Candidate
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-brand-600/10"
                  >
                    <CheckCircle2 size={14} />
                    {updating ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
