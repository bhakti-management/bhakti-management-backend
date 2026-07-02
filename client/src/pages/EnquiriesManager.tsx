import React, { useEffect, useState } from 'react';
import { Mail, Eye, Trash2, X, Phone, CheckCircle } from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export const EnquiriesManager: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Selected enquiry modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/enquiries?status=${statusFilter}` : '/api/enquiries';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const openDetailsModal = async (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setSelectedStatus(enquiry.status);

    // If the enquiry is UNREAD, automatically update it to READ on open for convenience
    if (enquiry.status === 'UNREAD') {
      try {
        await fetch(`/api/enquiries/${enquiry.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'READ' }),
        });
        // Update local status so UI stays in sync without a full reload
        setEnquiries(prev => prev.map(e => e.id === enquiry.id ? { ...e, status: 'READ' } : e));
        setSelectedStatus('READ');
      } catch (err) {
        console.error('Failed to auto-mark as read:', err);
      }
    }
  };

  const closeDetailsModal = () => {
    setSelectedEnquiry(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/enquiries/${selectedEnquiry.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (res.ok) {
        alert('Enquiry status updated successfully.');
        closeDetailsModal();
        fetchEnquiries();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this enquiry message? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEnquiries(enquiries.filter(e => e.id !== id));
        if (selectedEnquiry && selectedEnquiry.id === id) {
          closeDetailsModal();
        }
      } else {
        alert('Failed to delete enquiry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred during deletion.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Enquiries Inbox</h2>
        <p className="text-sm text-slate-400 mt-1">Review contact inquiries from potential partners and client companies</p>
      </div>

      {/* Filter Bar */}
      <div className="flex bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter by status</span>
        <div className="flex gap-2">
          {['', 'UNREAD', 'READ', 'RESPONDED', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === status
                  ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/10'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === '' ? 'All messages' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <Mail className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-base font-semibold text-white">Inbox empty</h3>
          <p className="text-sm text-slate-400 mt-1">No enquiries found in this category.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Date Received</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {enquiries.map((e) => (
                  <tr 
                    key={e.id} 
                    className={`hover:bg-slate-800/10 group cursor-pointer ${
                      e.status === 'UNREAD' ? 'font-semibold bg-brand-500/5' : ''
                    }`}
                    onClick={() => openDetailsModal(e)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {e.status === 'UNREAD' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                        )}
                        <div>
                          <p className="text-white">{e.name}</p>
                          <p className="text-xs text-slate-500 font-normal mt-0.5">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 align-middle max-w-xs truncate">
                      {e.subject}
                    </td>
                    <td className="px-6 py-4 text-slate-400 align-middle font-normal">
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 align-middle" onClick={(ev) => ev.stopPropagation()}>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        e.status === 'UNREAD' ? 'bg-blue-500/10 text-blue-400' :
                        e.status === 'READ' ? 'bg-slate-850 text-slate-400 border border-slate-700/50' :
                        e.status === 'RESPONDED' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(e)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="Open Message"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Enquiry"
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

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-white">Enquiry Message</h3>
                <span className="text-xs text-slate-400 mt-1">Received on {new Date(selectedEnquiry.createdAt).toLocaleDateString(undefined, {
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sender Name</span>
                  <p className="text-white font-semibold mt-0.5">{selectedEnquiry.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Message Subject</span>
                  <p className="text-brand-400 font-semibold mt-0.5">{selectedEnquiry.subject}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                  <Mail size={14} className="text-slate-500" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="hover:underline">{selectedEnquiry.email}</a>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                  <Phone size={14} className="text-slate-500" />
                  {selectedEnquiry.phone ? (
                    <a href={`tel:${selectedEnquiry.phone}`} className="hover:underline">{selectedEnquiry.phone}</a>
                  ) : (
                    <span className="text-slate-500 italic">No phone provided</span>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Message Body</span>
                <div className="bg-slate-950/20 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Form Updates */}
              <form onSubmit={handleUpdateStatus} className="space-y-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="w-full md:max-w-xs">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mark Message Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg py-2 px-3 text-white text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                    <option value="RESPONDED">Responded</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedEnquiry.id)}
                    className="flex items-center gap-1.5 px-4 py-2 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 font-semibold text-xs rounded-lg transition-colors border border-transparent hover:border-rose-500/20 mr-auto md:mr-0"
                  >
                    <Trash2 size={13} />
                    Delete Message
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
                    <CheckCircle size={14} />
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
