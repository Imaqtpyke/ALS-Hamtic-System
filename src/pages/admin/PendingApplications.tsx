import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { EyeIcon, BookOpenIcon, PlusIcon, RefreshCcwIcon, Trash2Icon, ToggleLeftIcon, ToggleRightIcon, SearchIcon, MailIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../AuthContext';
import { sendApprovalEmail, sendRejectionEmail } from '../../services/emailService';

interface EnrollmentApplication {
  id: string;
  created_at: string;
  user_id: string;
  personal_info: {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    phone: string;
  };
  educational_background: {
    lastGradeLevel: string;
    lastSchoolAttended: string;
    yearLastAttended: string;
    reason: string;
  };
  learning_preferences: {
    preferredSchedule: string;
    accommodation: string | null;
  };
  subjects: Array<{
    id: number;
    name: string;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

const PendingApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<EnrollmentApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  // Applications filter state
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  // Subjects management state
  const [subjects, setSubjects] = useState<{ id: number; name: string; active: boolean }[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Email preview modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAction, setEmailAction] = useState<'approve' | 'reject' | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailToName, setEmailToName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailRejectionReason, setEmailRejectionReason] = useState('');
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Skipping admin data fetch.');
      setLoading(false);
      setSubjectsLoading(false);
      return;
    }
    fetchPendingApplications();
    fetchSubjects();
  }, [statusFilter]);

  const fetchPendingApplications = async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from('enrollments')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    setSubjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, active')
        .order('id', { ascending: true });
      if (error) throw error;
      setSubjects((data || []).map((s: any) => ({ id: Number(s.id), name: s.name as string, active: s.active !== false })));
    } catch (err) {
      console.error('Error fetching subjects:', err);
      toast.error('Failed to load subjects');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const addSubject = async () => {
    const name = newSubject.trim();
    if (!name) return;
    try {
      const { error } = await supabase.from('subjects').insert({ name, active: true });
      if (error) throw error;
      setNewSubject('');
      toast.success('Subject added');
      fetchSubjects();
    } catch (err) {
      console.error('Error adding subject:', err);
      toast.error('Failed to add subject');
    }
  };

  const toggleSubject = async (id: number, active: boolean) => {
    try {
      const { error } = await supabase.from('subjects').update({ active: !active }).eq('id', id);
      if (error) throw error;
      setSubjects(prev => prev.map(s => (s.id === id ? { ...s, active: !active } : s)));
    } catch (err) {
      console.error('Error updating subject:', err);
      toast.error('Failed to update subject');
    }
  };

  const deleteSubject = async (id: number) => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast.success('Subject deleted');
    } catch (err) {
      console.error('Error deleting subject:', err);
      toast.error('Failed to delete subject');
    }
  };

  // Inline edit helpers for subjects
  const startEdit = (id: number, currentName: string) => {
    setEditingSubjectId(id);
    setEditName(currentName);
  };

  const cancelEdit = () => {
    setEditingSubjectId(null);
    setEditName('');
  };

  const saveEdit = async () => {
    const id = editingSubjectId;
    const name = editName.trim();
    if (!id || !name) return;
    try {
      const { error } = await supabase.from('subjects').update({ name }).eq('id', id);
      if (error) throw error;
      setSubjects(prev => prev.map(s => (s.id === id ? { ...s, name } : s)));
      toast.success('Subject updated');
      cancelEdit();
    } catch (err) {
      console.error('Error updating subject name:', err);
      toast.error('Failed to update subject');
    }
  };

  // Opens the email preview modal before performing approve/reject
  const openEmailModal = (action: 'approve' | 'reject', application: EnrollmentApplication) => {
    const fullName = `${application.personal_info.firstName} ${application.personal_info.middleName} ${application.personal_info.lastName}`.replace(/\s+/g, ' ').trim();
    setPendingApplicationId(application.id);
    setEmailAction(action);
    setEmailTo(application.personal_info.email);
    setEmailToName(fullName);
    setEmailRejectionReason('');

    if (action === 'approve') {
      setEmailSubject('Your ALS Application Has Been Accepted!');
      setEmailBody(
        `Dear ${fullName},\n\nWe are pleased to inform you that your application to the Hamtic Alternative Learning System (ALS) has been ACCEPTED.\n\nYou are now officially enrolled. Please wait for further instructions regarding your class schedule and orientation.\n\nWelcome to the ALS family!\n\nRegards,\nALS Administration\nHamtic, Antique`
      );
    } else {
      setEmailSubject('Update on Your ALS Application');
      setEmailBody(
        `Dear ${fullName},\n\nThank you for your interest in the Hamtic Alternative Learning System (ALS).\n\nAfter careful review, we regret to inform you that your application could not be approved at this time.\n\nReason: [write your reason in the field below]\n\nIf you have questions or would like to reapply, please contact us at our office.\n\nRegards,\nALS Administration\nHamtic, Antique`
      );
    }
    setShowEmailModal(true);
  };

  // Called when admin confirms from the email preview modal
  const handleConfirmEmailAndAction = async () => {
    if (!user?.uid || !pendingApplicationId || !emailAction) return;
    if (emailAction === 'reject' && !emailRejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      setActionLoading(true);

      // 1. Send email via EmailJS (best-effort)
      const studentName = emailToName;
      const studentEmail = emailTo;
      if (emailAction === 'approve') {
        const emailResult = await sendApprovalEmail(studentName, studentEmail, emailBody);
        if (!emailResult.success) {
          toast('Email could not be sent, but application will still be approved.', { icon: '⚠️' });
        }
      } else {
        const emailResult = await sendRejectionEmail(studentName, studentEmail, emailRejectionReason, emailBody);
        if (!emailResult.success) {
          toast('Email could not be sent, but application will still be rejected.', { icon: '⚠️' });
        }
      }

      // 2. Update Supabase status
      const { data: current, error: fetchError } = await supabase
        .from('enrollments')
        .select('status_history')
        .eq('id', pendingApplicationId)
        .single();
      if (fetchError) throw fetchError;

      const dbStatus = emailAction === 'approve' ? 'approved' : 'rejected';

      const currentHistory = Array.isArray(current?.status_history) ? current.status_history : [];
      const statusUpdate = {
        status: dbStatus,
        date: new Date().toISOString(),
        notes: emailAction === 'approve' ? 'Application approved by admin' : emailRejectionReason,
        updated_by: user.uid,
      };
      
      const updateFields: any = {
        status: dbStatus,
        status_history: [...currentHistory, statusUpdate],
      };
      
      if (emailAction === 'approve') updateFields.approved_at = new Date().toISOString();
      if (emailAction === 'reject') {
        updateFields.rejected_at = new Date().toISOString();
        updateFields.rejection_reason = emailRejectionReason;
      }

      const updateResult = await supabase
        .from('enrollments')
        .update(updateFields)
        .eq('id', pendingApplicationId);
      if (updateResult.error) throw updateResult.error;

      toast.success(emailAction === 'approve' ? 'Application approved & email sent!' : 'Application rejected & email sent!');
      setShowEmailModal(false);
      setShowModal(false);
      fetchPendingApplications();
    } catch (err: any) {
      console.error('Error processing application action:', err);
      toast.error(err?.message || 'Failed to process application');
    } finally {
      setActionLoading(false);
    }
  };



  // Delete an application only if it's not pending
  const deleteApplication = async (applicationId: string) => {
    try {
      const app = applications.find(a => a.id === applicationId);
      if (!app) return;
      const confirmed = window.confirm(`Delete this ${app.status} application permanently?`);
      if (!confirmed) return;
      const { error } = await supabase.from('enrollments').delete().eq('id', applicationId);
      if (error) throw error;
      toast.success('Application deleted');
      setApplications(prev => prev.filter(a => a.id !== applicationId));
      if (selectedApplication?.id === applicationId) {
        setShowModal(false);
        setSelectedApplication(null);
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      toast.error('Failed to delete application');
    }
  };

  const viewApplicationDetails = (application: EnrollmentApplication) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 bg-[#F9F9F9] min-h-screen">
      {/* Header Section */}
      <div className="mb-10">
        <span className="text-[#0038A8] font-bold tracking-widest uppercase text-xs">
          Administrative Portal
        </span>
        <h1 className="text-4xl font-black text-gray-900 mt-3 font-display">
          Enrollment Management
        </h1>
      </div>

      {/* Subjects Management */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BookOpenIcon className="w-6 h-6 text-[#0038A8]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Academic Strands</h2>
          </div>
          <button onClick={fetchSubjects} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#0038A8] transition-colors">
            <RefreshCcwIcon className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="card-tonal p-6">
          <div className="flex gap-3 mb-8">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Enter new subject name..."
              className="flex-1 px-4 py-3 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-[#0038A8] transition-all"
            />
            <button onClick={addSubject} className="btn-primary min-h-[48px] px-8">
              <PlusIcon className="w-5 h-5 mr-2" /> Add Strand
            </button>
          </div>
          {subjectsLoading ? (
            <div className="py-10 text-center text-gray-400 font-medium">Loading subjects…</div>
          ) : subjects.length === 0 ? (
            <div className="py-10 text-center text-gray-400 font-medium">No subjects recorded.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-transparent hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {editingSubjectId === s.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border-b-2 border-[#0038A8] bg-transparent focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className={`font-bold ${s.active ? 'text-gray-900' : 'text-gray-400'}`}>{s.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingSubjectId === s.id ? (
                      <>
                        <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">Save</button>
                        <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s.id, s.name)} className="p-2 text-gray-400 hover:text-[#0038A8] hover:bg-white rounded-lg transition-all" title="Edit">
                           <EyeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleSubject(s.id, s.active)} className="p-2 text-gray-400 hover:bg-white rounded-lg transition-all" title={s.active ? 'Deactivate' : 'Activate'}>
                          {s.active ? <ToggleRightIcon className="w-5 h-5 text-green-600" /> : <ToggleLeftIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={() => deleteSubject(s.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Delete">
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tabs Menu */}
      <div className="mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex p-1 bg-gray-200/50 rounded-2xl w-max">
            {[
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'all', label: 'All Applications' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${statusFilter === tab.id ? 'bg-white text-[#0038A8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#0038A8] transition-all"
              placeholder="Search enrolees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {applications.filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const fullName = `${app.personal_info.firstName} ${app.personal_info.middleName} ${app.personal_info.lastName}`.toLowerCase();
        return fullName.includes(term) || app.personal_info.email.toLowerCase().includes(term);
      }).length === 0 ? (
        <div className="text-center py-24 card-tonal bg-white">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
            <EyeIcon className="w-10 h-10 text-[#0038A8]" />
          </div>
          <h3 className="text-2xl font-black text-gray-900">
            No Records Found
          </h3>
          <p className="mt-2 text-gray-500 font-medium">Adjust your search or filters to see student data.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.filter(app => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const fullName = `${app.personal_info.firstName} ${app.personal_info.middleName} ${app.personal_info.lastName}`.toLowerCase();
            return fullName.includes(term) || app.personal_info.email.toLowerCase().includes(term);
          }).map((application) => {
            
            if (statusFilter === 'approved') {
              return (
                <div key={application.id} className="card-tonal group">
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full bg-green-50 text-green-700 border border-green-100">Enrolled Student</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 group-hover:text-[#0038A8] transition-colors font-display">
                          {application.personal_info.firstName} {application.personal_info.middleName} {application.personal_info.lastName}
                        </h2>
                        <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Contact</p>
                            <p className="font-bold text-gray-700">{application.personal_info.email}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grade Level</p>
                            <p className="font-bold text-gray-700">{application.educational_background.lastGradeLevel}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Strands</p>
                            <p className="font-bold text-gray-700">{application.subjects?.map(s => s.name).join(', ') || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-6 shrink-0 lg:border-l lg:border-gray-50 lg:pl-12">
                        <div className="lg:text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admission Date</p>
                          <p className="font-black text-[#0038A8] text-lg">{new Date(application.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => viewApplicationDetails(application)}
                            className="btn-primary py-2 px-6 text-sm"
                          >
                            View Dossier
                          </button>
                          <button
                            onClick={() => deleteApplication(application.id)}
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                            title="Remove Permanently"
                          >
                            <Trash2Icon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Standard Pending / Rejected Card
            return (
              <div key={application.id} className="card-tonal p-8 group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full border ${
                        application.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {application.status}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{new Date(application.submitted_at).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 group-hover:text-[#0038A8] transition-colors font-display">
                      {application.personal_info.firstName} {application.personal_info.middleName} {application.personal_info.lastName}
                    </h2>
                    <p className="text-gray-500 font-bold mt-1">{application.personal_info.email} • {application.personal_info.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => viewApplicationDetails(application)}
                      className="btn-primary py-2 px-6 text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => deleteApplication(application.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 z-[100] bg-[#0038A8]/20 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/50">
            {/* Header */}
            <div className="flex items-start justify-between px-10 py-8 border-b border-gray-50">
              <div>
                <span className="text-[#0038A8] font-bold tracking-widest uppercase text-[10px]">Student Dossier</span>
                <h2 className="text-3xl font-black text-gray-900 mt-1 font-display">{selectedApplication.personal_info.firstName} {selectedApplication.personal_info.middleName} {selectedApplication.personal_info.lastName}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 min-h-0 p-10 space-y-10 overflow-y-auto">
              <div>
                <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-[0.2em] mb-6">Contact & Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Legal Name</p>
                    <p className="font-extrabold text-gray-900">{selectedApplication.personal_info.firstName} {selectedApplication.personal_info.middleName} {selectedApplication.personal_info.lastName}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</p>
                    <p className="font-extrabold text-[#0038A8] break-all">{selectedApplication.personal_info.email}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</p>
                    <p className="font-extrabold text-gray-900">{selectedApplication.personal_info.phone}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-[0.2em] mb-6">Academic History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Last Completed Level</p>
                    <p className="font-extrabold text-gray-900">{selectedApplication.educational_background.lastGradeLevel}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Last Institution</p>
                    <p className="font-extrabold text-gray-900">{selectedApplication.educational_background.lastSchoolAttended} ({selectedApplication.educational_background.yearLastAttended})</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl md:col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for Formal Stop</p>
                    <p className="font-bold text-gray-700 italic leading-relaxed">"{selectedApplication.educational_background.reason}"</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-[0.2em] mb-6">System Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preferred Modality</p>
                    <p className="font-extrabold text-gray-900">{selectedApplication.learning_preferences.preferredSchedule}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Sticky Footer Actions */}
            <div className="px-10 py-8 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 font-bold hover:text-gray-700 transition-colors"
              >
                Return to List
              </button>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {selectedApplication.status === 'pending' ? (
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => openEmailModal('reject', selectedApplication)}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 disabled:opacity-60 transition-all border border-red-100 flex items-center gap-2"
                    >
                      <MailIcon className="w-4 h-4" />
                      Reject & Notify
                    </button>
                    <button
                      onClick={() => openEmailModal('approve', selectedApplication)}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none btn-cta min-h-[48px] px-8 flex items-center gap-2"
                    >
                      <MailIcon className="w-4 h-4" />
                      Approve & Notify
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => deleteApplication(selectedApplication.id)}
                    className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                  >
                    Permanent Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Preview Modal ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${emailAction === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <MailIcon className={`w-5 h-5 ${emailAction === 'approve' ? 'text-green-600' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Email Notification Preview
                  </p>
                  <h3 className="text-xl font-black text-gray-900">
                    {emailAction === 'approve' ? 'Send Acceptance Email' : 'Send Rejection Email'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Email Fields */}
            <div className="px-8 py-6 space-y-5">
              {/* To */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">To (Student Email)</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-[#0038A8]">{emailToName}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600 break-all">{emailTo}</span>
                  <span className="ml-auto text-[10px] bg-blue-50 text-[#0038A8] font-bold px-2 py-0.5 rounded-full">Pre-filled</span>
                </div>
              </div>

              {/* From */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">From</label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">ALS Administration — Hamtic ALS Program</span>
                  <span className="text-[10px] bg-blue-50 text-[#0038A8] font-bold px-2 py-0.5 rounded-full">Pre-filled</span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#0038A8] transition-all text-sm font-bold"
                />
              </div>

              {/* Reason (rejection only) */}
              {emailAction === 'reject' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailRejectionReason}
                    onChange={(e) => setEmailRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete requirements, slots are full..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-400 transition-all text-sm"
                  />
                </div>
              )}

              {/* Message Body */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Message Body (Editable)</label>
                <textarea
                  rows={9}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#0038A8] transition-all text-sm resize-none font-mono"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className={`px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[28px] ${emailAction === 'approve' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-500 font-bold hover:text-gray-700 transition-colors text-sm"
              >
                ← Go Back
              </button>
              <button
                onClick={handleConfirmEmailAndAction}
                disabled={actionLoading || (emailAction === 'reject' && !emailRejectionReason.trim())}
                className={`px-8 py-3 rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  emailAction === 'approve'
                    ? 'bg-[#0038A8] text-white hover:bg-[#002d8a] shadow-blue-900/20'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                <MailIcon className="w-4 h-4" />
                {actionLoading
                  ? 'Sending...'
                  : emailAction === 'approve'
                    ? 'Send Email & Approve'
                    : 'Send Email & Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApplications;

/* Usage example (in component):
const { user } = useAuth();
handleApprove(applicationId, user?.uid);
handleReject(applicationId, user?.uid);
// Make sure to update all calls to handleApprove/handleReject to pass the Firebase UID from AuthContext.
*/