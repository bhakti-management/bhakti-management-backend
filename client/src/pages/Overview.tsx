import React, { useEffect, useState } from 'react';
import { Briefcase, Users, Mail, ArrowRight, Clock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  status: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: string;
  job?: {
    title: string;
  };
}

interface Enquiry {
  id: string;
  name: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    jobsCount: 0,
    candidatesCount: 0,
    enquiriesCount: 0,
    unreadEnquiries: 0,
    pendingCandidates: 0,
  });
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [jobsRes, candidatesRes, enquiriesRes] = await Promise.all([
          fetch('/api/jobs/admin/all'),
          fetch('/api/candidates'),
          fetch('/api/enquiries'),
        ]);

        if (jobsRes.ok && candidatesRes.ok && enquiriesRes.ok) {
          const jobs: Job[] = await jobsRes.json();
          const candidates: Candidate[] = await candidatesRes.json();
          const enquiries: Enquiry[] = await enquiriesRes.json();

          // Calculate counters
          const unreadEnquiriesCount = enquiries.filter(e => e.status === 'UNREAD').length;
          const pendingCandidatesCount = candidates.filter(c => c.status === 'APPLIED').length;

          setStats({
            jobsCount: jobs.length,
            candidatesCount: candidates.length,
            enquiriesCount: enquiries.length,
            unreadEnquiries: unreadEnquiriesCount,
            pendingCandidates: pendingCandidatesCount,
          });

          // Sort and slice recent entries
          setRecentCandidates(candidates.slice(0, 5));
          setRecentEnquiries(enquiries.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading dashboard overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-sm text-slate-400 mt-1">Real-time statistics and activities for Bhakti Management</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jobs Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full group-hover:bg-brand-500/10 transition-colors duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Job Openings</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-white">{stats.jobsCount}</span>
            <button 
              onClick={() => onNavigate('jobs')}
              className="mt-4 text-xs font-semibold text-brand-400 flex items-center gap-1 hover:text-brand-300 transition-colors"
            >
              Manage listings <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Candidates Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full group-hover:bg-cyan-500/10 transition-colors duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Applications</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-white">{stats.candidatesCount}</span>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-cyan-400 font-bold">{stats.pendingCandidates}</span> pending review
            </p>
            <button 
              onClick={() => onNavigate('candidates')}
              className="mt-3 text-xs font-semibold text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors"
            >
              Review candidates <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Enquiries Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Client Enquiries</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Mail size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-white">{stats.enquiriesCount}</span>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-400 font-bold">{stats.unreadEnquiries}</span> unread messages
            </p>
            <button 
              onClick={() => onNavigate('enquiries')}
              className="mt-3 text-xs font-semibold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              View inbox <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Candidates List (Left) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-base">Recent Applications</h3>
            <button 
              onClick={() => onNavigate('candidates')}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium"
            >
              View All
            </button>
          </div>

          {recentCandidates.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg">
              <p className="text-slate-500 text-sm">No applications received yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Job Applied</th>
                    <th className="pb-3">Applied Date</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {recentCandidates.map((c) => (
                    <tr key={c.id} className="group hover:bg-slate-800/10">
                      <td className="py-3">
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.email}</p>
                      </td>
                      <td className="py-3 text-slate-300 align-middle">
                        {c.job?.title || <span className="text-slate-500 italic">General Candidate</span>}
                      </td>
                      <td className="py-3 text-slate-400 align-middle">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 align-middle text-right">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Enquiries List (Right) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-base">Inbox Feed</h3>
            <button 
              onClick={() => onNavigate('enquiries')}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium"
            >
              View All
            </button>
          </div>

          {recentEnquiries.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg">
              <p className="text-slate-500 text-sm">No enquiries found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEnquiries.map((e) => (
                <div 
                  key={e.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 hover:border-slate-700/60 ${
                    e.status === 'UNREAD' 
                      ? 'bg-slate-950/60 border-brand-500/20' 
                      : 'bg-slate-950/20 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-white text-sm truncate max-w-[120px]">{e.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-brand-400 mt-2 truncate">{e.subject}</h4>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{e.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
