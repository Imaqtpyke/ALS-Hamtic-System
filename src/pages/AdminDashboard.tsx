import { useState } from 'react';
import { AnnouncementManager } from '../components/admin/AnnouncementManager';
import { SubjectManagement } from '../components/admin/SubjectManagement';
import { 
  BookOpenIcon, BellIcon, 
  CheckCircleIcon, UsersIcon, 
  BarChart2Icon, GridIcon, SearchIcon, AlertTriangleIcon, MenuIcon, XIcon,
  EyeIcon, TrashIcon, CalendarIcon, MessageCircleIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataContext, Student } from '../DataContext';
import { isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { sendStatusEmail } from '../services/notificationService';

const StatCard = ({ icon, title, value, change, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-red-100 transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
  >
    <div className={`${color} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        {change && (
          <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">{change}</span>
        )}
      </div>
    </div>
  </div>
);

const PromptModal = ({ title, description, fields, onSubmit, onCancel, submitting = false }: any) => {
  const [formData, setFormData] = useState<any>(() => {
    const initial: any = {};
    fields.forEach((f: any) => {
      if (f.defaultValue) initial[f.name] = f.defaultValue;
    });
    return initial;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col"
      >
        <h2 className="text-2xl font-black mb-2 font-display uppercase tracking-tight text-gray-900">{title}</h2>
        {description && <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">{description}</p>}
        <div className="space-y-6">
          {fields.map((f: any) => (
            <div key={f.name} className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all font-medium text-sm" 
                  rows={4}
                  defaultValue={f.defaultValue || ''}
                  placeholder={f.placeholder}
                  onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                />
              ) : f.type === 'select' ? (
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all font-bold text-sm"
                  onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                  defaultValue={f.defaultValue || ""}
                >
                  <option value="" disabled>{f.placeholder || 'Select an option'}</option>
                  {f.options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type={f.type || 'text'}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all font-bold text-sm"
                  defaultValue={f.defaultValue || ''}
                  placeholder={f.placeholder}
                  onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-6 mt-10 pt-8 border-t border-gray-50">
          <button className="text-sm font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest" onClick={onCancel}>Discard</button>
          <button 
            disabled={submitting}
            className="px-10 py-4 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
            onClick={() => onSubmit(formData)}
          >
            {submitting ? 'Processing...' : 'Confirm Action'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminMessageModal = ({ student, onClose, onSubmit, submitting }: any) => {
  const [message, setMessage] = useState('');
  const limit = 500;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg border border-gray-100 flex flex-col"
      >
        <div className="mb-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Send Message to Applicant</p>
          <h2 className="text-2xl font-black font-display uppercase tracking-tight text-gray-900">{student.name}</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ref ID: {student.id}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message Content</label>
            <span className={`text-[10px] font-bold ${message.length > limit ? 'text-red-500' : 'text-gray-400'}`}>
              {limit - message.length} characters remaining
            </span>
          </div>
          <textarea 
            className="w-full p-6 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium text-sm resize-none" 
            rows={6}
            placeholder="e.g. Your birthdate is missing. Please update and resubmit your application."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-6 mt-8 pt-8 border-t border-gray-50">
          <button className="text-xs font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest" onClick={onClose}>Cancel</button>
          <button 
            disabled={submitting || !message.trim() || message.length > limit}
            className="px-8 py-4 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
            onClick={() => onSubmit(message)}
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminDashboard = () => {
  useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Data State
  const { 
    students, subjects, announcements, 
    loading: contextLoading, 
    updateStudent, deleteStudent, sendAdminMessage,
    addSubject, updateSubject, deleteSubject,
    addAnnouncement, updateAnnouncement, deleteAnnouncement
  } = useDataContext();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messagingStudent, setMessagingStudent] = useState<Student | null>(null);

  const [promptModal, setPromptModal] = useState<{ title: string; description?: string; fields: any[]; onSubmit: (data: any) => void } | null>(null);
  const [isPromptSubmitting, setIsPromptSubmitting] = useState(false);

  // Handlers

  const handleAddAnnouncement = () => {
    setPromptModal({
      title: 'Post an Announcement',
      fields: [
        { name: 'title', label: 'Announcement Title', type: 'text', placeholder: 'e.g. Enrollment Period Extended' },
        { 
          name: 'priority', 
          label: 'Priority Level', 
          type: 'select', 
          defaultValue: 'medium',
          options: [
            { label: 'Low - Informational', value: 'low' },
            { label: 'Medium - Important', value: 'medium' },
            { label: 'High - Critical', value: 'high' }
          ]
        },
        { name: 'message', label: 'Detailed Message', type: 'textarea', placeholder: 'Enter announcement content...' }
      ],
      onSubmit: async (data) => {
        if (!data.title || !data.message) return toast.error('Check all fields');
        setIsPromptSubmitting(true);
        try {
          await addAnnouncement(data);
          toast.success('Announcement posted to all applicants');
          setPromptModal(null);
        } catch (err: any) {
          toast.error(err.message || 'Post failed');
        } finally {
          setIsPromptSubmitting(false);
        }
      }
    });
  };

  const handleEditAnnounce = (ann: any) => {
    setPromptModal({
      title: 'Edit Announcement',
      fields: [
        { name: 'title', label: 'Announcement Title', type: 'text', defaultValue: ann.title },
        { 
          name: 'priority', 
          label: 'Priority Level', 
          type: 'select', 
          defaultValue: ann.priority,
          options: [
            { label: 'Low - Informational', value: 'low' },
            { label: 'Medium - Important', value: 'medium' },
            { label: 'High - Critical', value: 'high' }
          ]
        },
        { name: 'message', label: 'Detailed Message', type: 'textarea', defaultValue: ann.message }
      ],
      onSubmit: async (data) => {
        setIsPromptSubmitting(true);
        try {
          await updateAnnouncement(ann.id, data);
          toast.success('Announcement updated');
          setPromptModal(null);
        } catch (err: any) {
          toast.error(err.message || 'Update failed');
        } finally {
          setIsPromptSubmitting(false);
        }
      }
    });
  };

  const handleDeleteAnnounce = async (id: string) => {
    setPromptModal({
      title: 'Delete Announcement',
      description: 'Are you sure you want to remove this announcement? It will immediately disappear from all students\' dashboards. This action cannot be undone.',
      fields: [],
      onSubmit: async () => {
        setIsPromptSubmitting(true);
        try {
          await deleteAnnouncement(id);
          toast.success('Announcement removed');
          setPromptModal(null);
        } catch (err: any) {
          toast.error('Failed to remove announcement: ' + err.message);
        } finally {
          setIsPromptSubmitting(false);
        }
      }
    });
  };
  const handleDeleteStudent = (s: Student) => {
    setPromptModal({
      title: 'Delete Application',
      fields: [{ 
        name: 'confirm', 
        label: `To permanently delete ${s.name}'s record, type DELETE below.`, 
        placeholder: 'Type DELETE here' 
      }],
      onSubmit: async (data) => {
        if (data.confirm !== 'DELETE') {
          toast.error('Confirmation mismatch. Please type DELETE.');
          return;
        }
        setIsPromptSubmitting(true);
        try {
          await deleteStudent(s.id);
          toast.success('Applicant record removed permanently');
          setPromptModal(null);
        } catch (err: any) {
          toast.error('Deletion failed: ' + err.message);
        } finally {
          setIsPromptSubmitting(false);
        }
      }
    });
  };





  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.id?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedFilter === 'all' || s.status === selectedFilter)
  );

  if (contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mb-6"></div>
        <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Admin Records...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-red-600 rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-red-600/20">
          <AlertTriangleIcon size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">System Offline</h1>
        <p className="text-gray-600 max-w-md mb-10 font-medium font-sans">The Administrative database connection is not established. Please verify your Supabase environment variables before proceeding.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-red-600 text-white font-black rounded-3xl shadow-2xl shadow-red-600/30 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          Attempt Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen flex font-sans text-gray-900 overflow-hidden">
      {/* Backdrop for Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Dynamic Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex flex-col p-6 z-50 transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <BookOpenIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">ALS Hamtic</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Portal Admin</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-red-600 transition-all">
            <XIcon size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: <GridIcon size={20} /> },
            { id: 'analytics', name: 'Analytics', icon: <BarChart2Icon size={20} /> },
            { id: 'students', name: 'Applicants', icon: <UsersIcon size={20} /> },
            { id: 'subjects', name: 'Subject Management', icon: <BookOpenIcon size={20} /> },
            { id: 'announcements', name: 'Announcements', icon: <BellIcon size={20} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSidebarItem(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeSidebarItem === item.id ? 'bg-red-600 text-white shadow-xl shadow-red-600/20 scale-105' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 md:px-10 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-red-600 transition-all"
            >
              <MenuIcon size={24} />
            </button>
            <h2 className="text-xl font-black capitalize tracking-tight">{activeSidebarItem.replace('_', ' ')}</h2>
          </div>
          <div className="flex items-center gap-6">
            {activeSidebarItem === 'students' && (
              <div className="relative group animate-in fade-in duration-500">
                <input 
                  type="text" 
                  placeholder="Search Applicants..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl px-10 py-2.5 text-sm w-64 focus:ring-2 focus:ring-red-600 transition-all font-bold"
                />
                <SearchIcon className="absolute left-3.5 top-3 text-gray-300 w-4 h-4" />
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-white shadow-sm overflow-hidden">
              <img src="/DepED-Logo.jpg" alt="Profile" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          {activeSidebarItem === 'dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard onClick={() => { setActiveSidebarItem('students'); setSelectedFilter('all'); }} icon={<UsersIcon className="text-red-700" />} title="Total Applicants" value={students.length} color="bg-red-50" />
                <StatCard 
                  onClick={() => { setActiveSidebarItem('students'); setSelectedFilter('pending'); }} 
                  icon={<AlertTriangleIcon className="text-red-700" />} 
                  title="Pending Applicants" 
                  value={students.filter(s => s.status === 'pending').length} 
                  color="bg-red-50" 
                />
                <StatCard onClick={() => { setActiveSidebarItem('students'); setSelectedFilter('enrolled'); }} icon={<CheckCircleIcon className="text-red-700" />} title="Enrolled" value={students.filter(s => s.status === 'enrolled').length} change="Active" color="bg-red-50" />
                <StatCard onClick={() => { setActiveSidebarItem('subjects'); }} icon={<BookOpenIcon className="text-red-700" />} title="Subjects" value={subjects.length} color="bg-red-50" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black font-display">Recent Activity</h3>
                  </div>
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left font-display">
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Applicant Information</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Current Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 5).map(s => (
                          <tr key={s.id} className="border-t border-gray-50 group/row hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                              <p className="text-sm font-black text-gray-900 leading-tight mb-0.5 uppercase">{s.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold tabular-nums">ID: {s.id.slice(0, 8)}</p>
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                s.status === 'enrolled' ? 'bg-green-50 text-green-600 border border-green-100' : 
                                s.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>{s.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Mobile-First Card List */}
                  <div className="md:hidden space-y-4">
                    {students.slice(0, 5).map(s => (
                      <div key={s.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-sm font-black text-gray-900 uppercase">{s.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Lrn: {s.fullData?.personal_info?.lrn || 'N/A'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100/50">
                           <BookOpenIcon size={12} className="text-gray-400" />
                           <span className="text-[10px] font-black text-gray-500 uppercase">{s.subjects || 'Unassigned'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                  <div className="bg-red-600 rounded-[32px] p-8 text-white shadow-xl shadow-red-600/20">
                     <h3 className="text-lg font-black mb-2">Post an Announcement</h3>
                     <p className="text-red-100 text-sm mb-6 font-medium">Send a message to all applicants about updates or schedules.</p>
                     <button onClick={handleAddAnnouncement} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-sm hover:bg-red-50 transition-all active:scale-95 shadow-lg">New Announcement</button>
                  </div>
              </div>
            </div>
          )}          {activeSidebarItem === 'students' && (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1 uppercase font-display">Applicant List</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Applicants: {filteredStudents.length}</p>
                </div>
                <div className="flex gap-4">
                  <select 
                    value={selectedFilter}
                    onChange={e => setSelectedFilter(e.target.value)}
                    className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-red-600/10 transition-all cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending Review</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 sm:p-10 overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="text-left font-display">
                      <th className="px-6 pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">#</th>
                      <th className="px-6 pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                      <th className="px-6 pb-8 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((s, i) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-all group/row">
                        <td className="px-6 py-8 text-[10px] font-black text-gray-300 tabular-nums">
                           {String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="px-6 py-8">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-900 border border-gray-100 group-hover/row:bg-red-600 group-hover/row:text-white transition-colors uppercase">
                                 {s.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight inline-flex items-center gap-2">
                                   {s.name}
                                   {s.is_resubmission && (
                                     <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black rounded uppercase tracking-widest animate-pulse border border-orange-200">
                                       Resubmitted
                                     </span>
                                   )}
                                 </p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {s.id.slice(0, 8)}</p>
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                      s.status === 'enrolled' ? 'bg-green-100 text-green-700' :
                                      s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {s.status === 'enrolled' ? 'Enrolled' : s.status === 'rejected' ? 'Rejected' : 'Pending'}
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-8 text-right">
                           <div className="flex items-center justify-end gap-1.5">
                             <button 
                               onClick={() => setSelectedStudent(s)}
                               className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm font-black text-[10px] uppercase tracking-widest min-w-[100px]"
                               title="View Details"
                             >
                               <EyeIcon size={14} /> View
                             </button>
                             
                             <button 
                               onClick={() => {
                                 setPromptModal({
                                   title: 'Enroll Applicant',
                                   fields: [{ name: 'note', label: 'Welcome Note', placeholder: 'e.g. Welcome to ALS-Hamtic!' }],
                                   onSubmit: async (_data) => {
                                     setIsPromptSubmitting(true);
                                     try {
                                       await updateStudent(s.id, { status: 'enrolled' });
                                       await sendAdminMessage(s.id, s.fullData.user_id, "Congratulations! Your ALS enrollment application has been approved. Welcome to the ALS Hamtic program.");
                                       await sendStatusEmail(s.name, s.email, 'enrolled');
                                       toast.success(`${s.name} has been enrolled!`);
                                       setPromptModal(null);
                                     } catch (err: any) {
                                       toast.error(err.message || 'Failed to enroll applicant.');
                                     } finally {
                                       setIsPromptSubmitting(false);
                                     }
                                   }
                                 });
                               }}
                               disabled={s.status === 'enrolled'}
                               className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm font-black text-[10px] uppercase tracking-widest min-w-[110px] ${
                                 s.status === 'enrolled' ? 'opacity-40 cursor-not-allowed bg-green-600 text-white' : 'bg-[#16a34a] text-white hover:bg-green-700 active:scale-95'
                               }`}
                               title="Enroll Applicant"
                              >
                               <CheckCircleIcon size={14} /> Enroll
                             </button>

                             <button 
                               onClick={() => setMessagingStudent(s)}
                               disabled={s.status !== 'pending'}
                               className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm font-black text-[10px] uppercase tracking-widest min-w-[110px] ${
                                 s.status !== 'pending' ? 'hidden' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                               }`}
                               title="Message Applicant"
                              >
                               <MessageCircleIcon size={14} /> Message
                             </button>
                             

                             <button 
                               onClick={() => {
                                 setPromptModal({
                                   title: 'Decline Application',
                                   fields: [{ name: 'reason', label: 'Reason for Rejection', placeholder: 'e.g. Ineligible' }],
                                   onSubmit: async (data) => {
                                     setIsPromptSubmitting(true);
                                     try {
                                       await updateStudent(s.id, { status: 'rejected' });
                                       const rejectionMsg = `Your ALS enrollment application has been reviewed. Unfortunately it was not approved at this time.${data.reason ? ` Reason: ${data.reason}` : ''}`;
                                       await sendAdminMessage(s.id, s.fullData.user_id, rejectionMsg);
                                       await sendStatusEmail(s.name, s.email, 'rejected', data.reason);
                                       toast.success('Application rejected');
                                       setPromptModal(null);
                                     } catch (err: any) {
                                       toast.error(err.message || 'Failed to reject application. Please try again.');
                                     } finally {
                                       setIsPromptSubmitting(false);
                                     }
                                   }
                                 });
                               }}
                               disabled={s.status === 'rejected'}
                               className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm font-black text-[10px] uppercase tracking-widest min-w-[100px] ${
                                 s.status === 'rejected' ? 'opacity-50 cursor-not-allowed bg-red-600 text-white' : 'bg-[#dc2626] text-white hover:bg-red-700 active:scale-95'
                               }`}
                               title="Reject"
                             >
                               <XIcon size={14} /> Reject
                             </button>
                             <button 
                                onClick={() => handleDeleteStudent(s)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-400 border border-gray-100 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm group/del"
                                title="Delete Applicant"
                              >
                                <TrashIcon size={14} className="group-hover/del:scale-110 transition-transform" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Registry Card View */}
              <div className="md:hidden divide-y divide-gray-50 p-6">
                {filteredStudents.map((s, i) => (
                  <div key={s.id} className="py-6 space-y-4">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-900 border border-gray-100 uppercase">
                               {s.name.charAt(0)}
                            </div>
                            <span className="absolute -top-2 -left-2 w-5 h-5 bg-red-600 text-white text-[8px] flex items-center justify-center rounded-full font-black border-2 border-white">{i + 1}</span>
                          </div>
                          <div>
                             <p className="font-black text-sm uppercase tracking-tight">{s.name}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {s.id.slice(0, 8)}</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setSelectedStudent(s)} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Preview Details</button>
                       <button onClick={() => handleDeleteStudent(s)} className="p-3 bg-red-50 text-red-600 rounded-xl active:bg-red-600 active:text-white transition-all shadow-sm border border-red-100"><TrashIcon size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'announcements' && (
             <AnnouncementManager 
                announcements={announcements} 
                handleAddAnnouncement={handleAddAnnouncement} 
                handleEditAnnounce={handleEditAnnounce}
                handleDeleteAnnounce={handleDeleteAnnounce}
             />
          )}

          {activeSidebarItem === 'subjects' && (
             <SubjectManagement 
                subjects={subjects}
                setPromptModal={setPromptModal}
                setIsPromptSubmitting={setIsPromptSubmitting}
                addSubject={addSubject}
                updateSubject={updateSubject}
                deleteSubject={deleteSubject}
             />
          )}


          {activeSidebarItem === 'analytics' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8">Enrollment Status</h3>
                  <div style={{ width: '100%', minHeight: '300px' }}>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                        { name: 'Enrolled', key: 'enrolled' },
                        { name: 'Pending', key: 'pending' },
                        { name: 'Rejected', key: 'rejected' }
                      ].map(s => ({ name: s.name, count: students.filter(st => st.status === s.key).length }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip cursor={{ fill: '#f9fafb' }} />
                        <Bar dataKey="count" fill="#ef4444" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8">Monthly Enrollment Growth</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(() => {
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const currentYear = new Date().getFullYear();
                      const growthData = months.map((m, i) => {
                        const count = students.filter(s => {
                          const date = new Date(s.enrollmentDate);
                          return date.getMonth() === i && date.getFullYear() === currentYear;
                        }).length;
                        return { month: m, count }; 
                      }).slice(0, new Date().getMonth() + 1);
                      return growthData;
                    })()}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}




          {/* Form Modals */}

          {selectedStudent && (
            <StudentDetailModal 
              student={selectedStudent} 
              onClose={() => setSelectedStudent(null)} 
            />
          )}

           {promptModal && (
            <PromptModal 
              {...promptModal} 
              submitting={isPromptSubmitting} 
              onCancel={() => setPromptModal(null)} 
            />
          )}

          {messagingStudent && (
            <AdminMessageModal 
              student={messagingStudent}
              submitting={isPromptSubmitting}
              onClose={() => setMessagingStudent(null)}
              onSubmit={async (message: string) => {
                setIsPromptSubmitting(true);
                try {
                  await sendAdminMessage(messagingStudent.id, messagingStudent.fullData.user_id, message);
                  toast.success(`Message sent to ${messagingStudent.name}`);
                  setMessagingStudent(null);
                } catch (err: any) {
                  toast.error(err.message || 'Failed to send message');
                } finally {
                  setIsPromptSubmitting(false);
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const StudentDetailModal = ({ student, onClose }: { student: Student; onClose: () => void }) => {
  const data = student.fullData || {};
  const personal = data.personal_info || {};
  const education = data.educational_background || {};
  const preferences = data.learning_preferences || {};
  const subjects = data.subjects || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 lg:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl h-full max-h-[95vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative border border-gray-100"
      >
        {/* Modal Header */}
        <div className="bg-white p-8 md:px-12 md:py-8 border-b border-gray-100 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-6">
              <div className="w-1.5 h-12 bg-[#0038A8] rounded-full" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {personal.firstName} {personal.middleName ? `${personal.middleName} ` : ''}{personal.lastName}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    student.status === 'enrolled' ? 'bg-green-50 text-green-600 border border-green-100' :
                    student.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {student.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircleIcon size={12} className="text-gray-300" />
                    ID: {student.id.slice(0, 12)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon size={12} className="text-gray-300" />
                    Submitted: {new Date(student.enrollmentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
           </div>
           
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all active:scale-95">
             <XIcon size={24} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-12 md:space-y-16">
          
          {/* Step 1: Personal Information */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#0038A8] rounded-sm" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 1: Personal Identity</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DataField label="First Name" value={personal.firstName} />
                <DataField label="Middle Name" value={personal.middleName} />
                <DataField label="Last Name" value={personal.lastName} />
                <DataField label="Gender" value={personal.gender} />
                <DataField label="Birthdate" value={personal.birthdate} />
                <DataField label="LRN (Learner Reference #)" value={personal.lrn} highlight />
                <div className="md:col-span-2">
                  <DataField label="Complete Address" value={personal.address} />
                </div>
                <DataField label="Street / Purok" value={personal.addressStreet} />
                <DataField label="Barangay" value={personal.addressBarangay} />
                <DataField label="City / Municipality" value={personal.addressCity} />
                <DataField label="Province" value={personal.addressProvince} />
                <DataField label="ZIP Code" value={personal.addressZip} />
                <DataField label="Email Address" value={personal.email} highlight />
                <DataField label="Phone Number" value={personal.phone} highlight />
             </div>
          </section>

          {/* Step 2: Educational Background */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#0038A8] rounded-sm" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 2: Educational History</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Last Grade Level Completed" value={education.lastGradeLevel} />
                <DataField label="Last School Attended" value={education.lastSchoolAttended} />
                <DataField label="Year Last Attended" value={education.yearLastAttended} />
                <div className="md:col-span-2">
                   <DataField label="Reason for Stopping" value={education.reason} />
                </div>
             </div>
          </section>

          {/* Step 3: Learning Preferences */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#0038A8] rounded-sm" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 3: Learning Preferences</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Preferred Learning Style" value={preferences.learningStyle} />
                <DataField label="Preferred Schedule" value={preferences.preferredSchedule?.replace(/_/g, ' ').toUpperCase()} />
                <div className="md:col-span-2">
                   <DataField label="Special Accommodations" value={preferences.accommodation} />
                </div>
             </div>
          </section>

          {/* Step 4: Available Subjects (Selected) */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#0038A8] rounded-sm" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 4: Selected Subjects</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((s: any) => (
                  <div key={s.id} className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0038A8] flex items-center justify-center text-white">
                      <BookOpenIcon size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-[#0038A8] uppercase tracking-tight">{s.name}</span>
                  </div>
                ))}
                {subjects.length === 0 && (
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No subjects selected</p>
                )}
             </div>
          </section>

          {/* Step 5: Final Review Status */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#0038A8] rounded-sm" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 5: Final Status</h3>
             </div>
             <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Current Application State</p>
                  <div className="flex items-center gap-3">
                    <h4 className="text-2xl font-bold text-gray-900 capitalize leading-none">{student.status}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.status === 'enrolled' ? 'bg-green-100 text-green-700' :
                      student.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
             </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-6 md:px-12 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ALS Hamtic Digital Intake Portal v1.0</p>
            <button onClick={onClose} className="bg-[#0038A8] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 active:scale-95">
              Close
            </button>
        </div>
      </motion.div>
    </div>
  );
};

const DataField = ({ label, value, highlight = false }: any) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/50">
    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className={`text-sm font-semibold truncate ${highlight ? 'text-[#0038A8]' : 'text-gray-800'}`}>
      {(!value || value === 'NOT PROVIDED') ? (
        <span className="text-gray-300 italic font-normal">-</span>
      ) : (
        value
      )}
    </p>
  </div>
);

export default AdminDashboard;