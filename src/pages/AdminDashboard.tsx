import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnnouncementManager } from '../components/admin/AnnouncementManager';
import { SubjectManagement } from '../components/admin/SubjectManagement';
import { 
  BookOpenIcon, CalendarIcon, BellIcon, FileTextIcon, SettingsIcon, LogOutIcon, 
  ChevronDownIcon, CheckCircleIcon, ClockIcon, UsersIcon, 
  BarChart2Icon, GridIcon, SearchIcon, TrashIcon, EditIcon, EyeIcon, 
  DownloadIcon, HistoryIcon, AlertTriangleIcon, InfoIcon, MapPinIcon, MenuIcon, XIcon, ShieldIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataContext, Student, Subject, Announcement } from '../DataContext';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { logAuditAction } from '../utils/auditLogger';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { sendStatusEmail } from '../services/notificationService';

const StatCard = ({ icon, title, value, change, color }: any) => (
  <div className={`bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-red-100 transition-all`}>
    <div className={`${color} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">{change}</span>
      </div>
    </div>
  </div>
);

const PromptModal = ({ title, fields, onSubmit, onCancel, submitting = false }: any) => {
  const [formData, setFormData] = useState<any>(() => {
    const initial: any = {};
    fields.forEach((f: any) => {
      if (f.defaultValue) initial[f.name] = f.defaultValue;
      // If it's a select and has no default, set to first option if required
      if (f.type === 'select' && !initial[f.name] && f.options?.length > 0) {
        // We can choose not to default, but usually for select it helps
      }
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
        <h2 className="text-2xl font-black mb-6 font-display uppercase tracking-tight text-gray-900">{title}</h2>
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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Data State
  const { 
    students, subjects, announcements, 
    profiles, auditLogs,
    loading: contextLoading, error: contextError, 
    updateStudent, deleteStudent, addStudent, 
    addSubject, updateSubject, deleteSubject,
    addAnnouncement, updateAnnouncement, deleteAnnouncement,
    refreshData,
    blockUser, unblockUser, deleteUserAccount
  } = useDataContext();

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Forms Visibility
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editAnnounce, setEditAnnounce] = useState<any | null>(null);
  const [promptModal, setPromptModal] = useState<{ title: string; fields: any[]; onSubmit: (data: any) => void } | null>(null);
  const [isPromptSubmitting, setIsPromptSubmitting] = useState(false);




  // Handlers
  const handleAddStudent = () => {
    setPromptModal({
      title: 'Add New Learner',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Last Name, First Name' },
        { name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@example.com' },
        { name: 'lrn', label: 'LRN (12 Digits)', type: 'text', placeholder: '000000000000' },
        { 
          name: 'status', 
          label: 'Initial Status', 
          type: 'select', 
          defaultValue: 'pending',
          options: [
            { label: 'Waiting for Review', value: 'pending' },
            { label: 'Currently Enrolled', value: 'enrolled' },
            { label: 'Not Accepted', value: 'rejected' }
          ]
        }
      ],
      onSubmit: async (data) => {
        if (!data.name || !data.email) return toast.error('Required fields missing');
        setIsPromptSubmitting(true);
        try {
          await addStudent({
            ...data,
            enrollmentDate: new Date().toISOString(),
            subjects: 0,
            progress: 0
          });
          toast.success('Applicant registered');
          setPromptModal(null);
        } catch (err: any) {
          toast.error(err.message || 'Addition failed');
        } finally {
          setIsPromptSubmitting(false);
        }
      }
    });
  };

  const handleEditStudent = (s: Student) => {
    setPromptModal({
      title: 'Modify Learner Record',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', defaultValue: s.name },
        { name: 'email', label: 'Email Address', type: 'email', defaultValue: s.email },
        { 
          name: 'status', 
          label: 'Enrollment Status', 
          type: 'select', 
          defaultValue: s.status,
          options: [
            { label: 'Waiting for Review', value: 'pending' },
            { label: 'Currently Enrolled', value: 'enrolled' },
            { label: 'Graduated / Completed', value: 'graduated' },
            { label: 'Not Accepted', value: 'rejected' }
          ]
        }
      ],
      onSubmit: async (data) => {
        setIsPromptSubmitting(true);
        try {
          await updateStudent(s.id, data);
          toast.success('Record updated successfully');
          setPromptModal(null);
        } catch (err: any) {
          toast.error(err.message || 'Update failed');
        } finally {
          setIsPromptSubmitting(false);
        }
      }
    });
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this applicant? This cannot be undone.')) {
      deleteStudent(id);
    }
  };

  const handleAddSubject = () => { setEditSubject(null); setShowSubjectForm(true); };
  const handleEditSubject = (s: Subject) => { setEditSubject(s); setShowSubjectForm(true); };
  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Delete this subject?')) deleteSubject(id);
  };

  const handleAddAnnouncement = () => {
    setPromptModal({
      title: 'Post a Notice',
      fields: [
        { name: 'title', label: 'Notice Title', type: 'text', placeholder: 'e.g. Enrollment Period Extended' },
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
          toast.success('Notice sent to all applicants');
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
      title: 'Edit Notice',
      fields: [
        { name: 'title', label: 'Notice Title', type: 'text', defaultValue: ann.title },
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
          toast.success('Notice updated');
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
    if (window.confirm('Delete this notice? This cannot be undone.')) {
      try {
        await deleteAnnouncement(id);
        toast.success('Notice removed');
      } catch (err: any) {
        toast.error('Failed to remove notice: ' + err.message);
      }
    }
  };


  // Export Logic
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MasterList");
    XLSX.writeFile(wb, "ALS_Hamtic_Master_List.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text("ALS Hamtic - Student Enrollment Report", 14, 15);
    doc.autoTable({
      head: [['ID', 'Name', 'Email', 'Subjects', 'Status']],
      body: students.map(s => [s.id, s.name, s.email, s.subjects, s.status]),
      startY: 20
    });
    doc.save("ALS_Report.pdf");
  };

  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.id?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedFilter === 'all' || s.status === selectedFilter)
  );

  if (contextLoading || isDataLoading) {
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
            { id: 'announcements', name: 'Notices', icon: <BellIcon size={20} /> },
            { id: 'users', name: 'Manage Users', icon: <ShieldIcon size={20} /> },
            { id: 'reports', name: 'History', icon: <HistoryIcon size={20} /> },
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

        <button onClick={() => logout()} className="mt-auto flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOutIcon size={20} />
          Sign Out
        </button>
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
            {(activeSidebarItem !== 'audit_logs' && activeSidebarItem !== 'schedule') && (
              <div className="relative group animate-in fade-in duration-500">
                <input 
                  type="text" 
                  placeholder="Global search..." 
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
                <StatCard icon={<UsersIcon className="text-red-700" />} title="Total Applicants" value={students.length} change="+12.5%" color="bg-red-50" />
                <StatCard icon={<ClockIcon className="text-amber-700" />} title="Waiting for Review" value={students.filter(s => s.status === 'pending').length} change="Attention Required" color="bg-amber-50 shadow-sm border border-amber-100" />
                <StatCard icon={<BellIcon className="text-red-700" />} title="Active Notices" value={announcements.length} change="Stable" color="bg-red-50" />
                <StatCard icon={<CheckCircleIcon className="text-red-700" />} title="Enrolled" value={students.filter(s => s.status === 'enrolled').length} change="Active" color="bg-red-50" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black font-display">Recent Activity</h3>
                    <div className="flex gap-2">
                       <button onClick={exportToExcel} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"><DownloadIcon size={18} /></button>
                       <button onClick={exportToPDF} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"><FileTextIcon size={18} /></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full min-w-[800px]">
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
                
                <div className="space-y-8">
                  <div className="bg-red-600 rounded-[32px] p-8 text-white shadow-xl shadow-red-600/20">
                     <h3 className="text-lg font-black mb-2">Send a Notice</h3>
                     <p className="text-red-100 text-sm mb-6 font-medium">Send a message to all applicants about updates or schedules.</p>
                     <button onClick={handleAddAnnouncement} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-sm hover:bg-red-50 transition-all active:scale-95 shadow-lg">New Notice</button>
                  </div>
                  <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                     <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">System Health</h3>
                     <div className="space-y-4 text-xs font-bold text-gray-400">
                        <div className="flex justify-between"><span>Supabase</span> <span className="text-green-500">Connected</span></div>
                        <div className="flex justify-between"><span>Vercel Deploy</span> <span className="text-green-500">v1.2.4</span></div>
                        <div className="flex justify-between"><span>Auth Layer</span> <span className="text-green-500">Secure</span></div>
                     </div>
                  </div>
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
                    <option value="pending">Pending</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="review">Under Review</option>
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
                                 <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">{s.name}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {s.id.slice(0, 8)}</p>
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                       s.status === 'enrolled' ? 'bg-green-100 text-green-700' :
                                       s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                       'bg-amber-100 text-amber-700'
                                    }`}>{s.status}</span>
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
                                   title: 'Accept Applicant',
                                   fields: [{ name: 'note', label: 'Welcome Note', placeholder: 'e.g. Welcome to ALS-Hamtic!' }],
                                   onSubmit: async (data) => {
                                     setIsPromptSubmitting(true);
                                     await updateStudent(s.id, { status: 'enrolled' });
                                     await sendStatusEmail(s.name, s.email, 'enrolled');
                                     toast.success('Applicant accepted!');
                                     setPromptModal(null);
                                     setIsPromptSubmitting(false);
                                   }
                                 });
                               }}
                               disabled={s.status === 'enrolled'}
                               className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm font-black text-[10px] uppercase tracking-widest min-w-[110px] ${
                                 s.status === 'enrolled' ? 'opacity-50 cursor-not-allowed bg-green-600 text-white' : 'bg-[#16a34a] text-white hover:bg-green-700 active:scale-95'
                               }`}
                               title="Approve"
                              >
                               <CheckCircleIcon size={14} /> Approve
                             </button>
                             
                             <button 
                               onClick={() => {
                                 setPromptModal({
                                   title: 'Review Application',
                                   fields: [{ name: 'reason', label: 'Missing Info / Issue', placeholder: 'e.g. Birth certificate is blurry' }],
                                   onSubmit: async (data) => {
                                     setIsPromptSubmitting(true);
                                     await updateStudent(s.id, { status: 'review' });
                                     await sendStatusEmail(s.name, s.email, 'review', data.reason);
                                     toast.success('Application marked for review');
                                     setPromptModal(null);
                                     setIsPromptSubmitting(false);
                                   }
                                 });
                               }}
                               disabled={s.status === 'review'}
                               className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm font-black text-[10px] uppercase tracking-widest min-w-[100px] ${
                                 s.status === 'review' ? 'opacity-50 cursor-not-allowed bg-amber-600 text-white' : 'bg-[#d97706] text-white hover:bg-amber-700 active:scale-95'
                               }`}
                               title="Review"
                             >
                               <AlertTriangleIcon size={14} /> Review
                             </button>

                             <button 
                               onClick={() => {
                                 setPromptModal({
                                   title: 'Decline Application',
                                   fields: [{ name: 'reason', label: 'Reason for Rejection', placeholder: 'e.g. Ineligible' }],
                                   onSubmit: async (data) => {
                                     setIsPromptSubmitting(true);
                                     await updateStudent(s.id, { status: 'rejected' });
                                     await sendStatusEmail(s.name, s.email, 'rejected', data.reason);
                                     toast.success('Application rejected');
                                     setPromptModal(null);
                                     setIsPromptSubmitting(false);
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
                       <button onClick={() => handleDeleteStudent(s.id)} className="p-3 bg-red-50 text-red-600 rounded-xl active:bg-red-600 active:text-white transition-all shadow-sm border border-red-100"><TrashIcon size={16} /></button>
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
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Enrolled', key: 'enrolled' },
                        { name: 'Pending', key: 'pending' },
                        { name: 'In Review', key: 'review' },
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



          {activeSidebarItem === 'users' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Manage Users</h2>
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-xs uppercase tracking-widest text-gray-500">
                   <ShieldIcon size={14} className="text-red-600" /> Administrative Access
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {profiles.filter(p => {
                  // Only show admins and registered students (enrolled, blocked, or graduated)
                  if (p.role === 'admin') return true;
                  const student = students.find(s => s.fullData?.user_id === p.id);
                  return !!student; // Show any student that exists in our registry
                }).map(profile => (
                  <div key={profile.id} className="bg-white p-8 rounded-[32px] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-gray-200/20 transition-all group">
                    <div className="flex items-center gap-8">
                       <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl ${
                         profile.is_blocked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-900'
                       }`}>
                         {(profile.email || 'U').charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{profile.email || 'Anonymous User'}</h4>
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                               profile.role === 'admin' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-100 text-gray-500'
                             }`}>
                               {profile.role}
                             </span>
                             {profile.is_blocked && (
                               <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-red-600/20 border-2 border-white">
                                 BLOCKED
                               </span>
                             )}
                          </div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UID: {profile.id}</p>
                           {profile.is_blocked && profile.block_reason && (
                             <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 max-w-md">
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1.5 leading-none">Restriction Reason:</p>
                                <p className="text-[11px] font-bold text-red-900 leading-relaxed italic line-clamp-2">"{profile.block_reason}"</p>
                             </div>
                           )}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* NEW: Edit functionality for Profiles */}
                      <button 
                        onClick={() => {
                          setPromptModal({
                            title: 'Edit Access Information',
                            fields: [
                              { name: 'email', label: 'Login Email Address', type: 'email', defaultValue: profile.email },
                              { 
                                name: 'role', 
                                label: 'User Role', 
                                type: 'select', 
                                defaultValue: profile.role,
                                options: [
                                  { label: 'Student', value: 'student' },
                                  { label: 'Administrator', value: 'admin' }
                                ]
                              }
                            ],
                            onSubmit: async (data) => {
                              setIsPromptSubmitting(true);
                              try {
                                await updateProfile(profile.id, data);
                                toast.success('User updated successfully');
                                setPromptModal(null);
                              } catch (err: any) {
                                toast.error(err.message || 'Update failed');
                              } finally {
                                setIsPromptSubmitting(false);
                              }
                            }
                          });
                        }}
                        className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <EditIcon size={18} />
                      </button>

                      {profile.is_blocked ? (
                        <button 
                          onClick={() => {
                            if(window.confirm(`Unblock ${profile.email}? Account will be restored immediately.`)) unblockUser(profile.id);
                          }}
                          className="px-6 py-3 bg-green-50 text-green-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                        >
                          <CheckCircleIcon size={14} /> Restore Access
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setPromptModal({
                              title: 'Restrict Account',
                              fields: [
                                { 
                                  name: 'reason', 
                                  label: 'Primary Violation', 
                                  type: 'select',
                                  placeholder: 'Choose a reason...',
                                  options: [
                                    { label: 'Violation of Terms of Service', value: 'Violation of Terms of Service' },
                                    { label: 'Suspicious Login Activity', value: 'Suspicious Login Activity' },
                                    { label: 'Incomplete Requirements / False Info', value: 'Incomplete Requirements / False Info' },
                                    { label: 'Unprofessional Conduct', value: 'Unprofessional Conduct' },
                                    { label: 'System Maintenance / Audit', value: 'System Maintenance / Audit' },
                                    { label: 'Other (Manual Entry)', value: 'other' }
                                  ]
                                },
                                { 
                                  name: 'customReason', 
                                  label: 'Additional Notes / Manual Reason', 
                                  type: 'textarea', 
                                  placeholder: 'Provide specific details for the restriction...' 
                                }
                              ],
                              onSubmit: (data) => {
                                const finalReason = data.reason === 'other' ? data.customReason : (data.reason + (data.customReason ? `: ${data.customReason}` : ''));
                                if(!finalReason) return toast.error('A reason is required');
                                blockUser(profile.id, finalReason);
                                setPromptModal(null);
                              }
                            });
                          }}
                          className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
                        >
                          Suspend User
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          if(confirm('PERMANENTLY DELETE ACCOUNT? This will erase all enrollment data linked to this user.')) {
                            deleteUserAccount(profile.id);
                          }
                        }}
                        className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'reports' && (
            <div className="space-y-10">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Systems Audit</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] font-medium">Internal Security Activity Log</p>
                  </div>
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 border border-gray-100">
                     <HistoryIcon size={24} />
                  </div>
               </div>
               
               <div className="space-y-4">
                  {auditLogs?.map(log => (
                     <div key={log.id} className="bg-white p-6 rounded-[24px] border border-gray-100 flex items-center justify-between shadow-sm group hover:border-red-600/50 transition-all duration-300">
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                             log.action?.includes('delete') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                           }`}>
                              {log.action?.includes('enrollment') ? <UsersIcon size={20} /> : <InfoIcon size={20} />}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none px-2 py-0.5 bg-gray-50 rounded inline-block">Event Type: {log.target_type}</p>
                              <h4 className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase tabular-nums">Action: {log.action?.replace(/_/g, ' ') || 'SYSTEM_EVENT'}</h4>
                              <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">Target: <span className="font-bold text-gray-900">{log.target_id || 'Global'}</span></p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</p>
                           <p className="text-lg font-black text-gray-300 group-hover:text-red-600 transition-colors tabular-nums leading-tight">
                             {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                  ))}
                  
                  {auditLogs.length === 0 && (
                    <div className="p-20 text-center bg-white rounded-[48px] border border-dashed border-gray-200">
                      <HistoryIcon size={48} className="mx-auto text-gray-200 mb-6" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activities recorded yet</p>
                    </div>
                  )}
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
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className="bg-[#fcfcfc] w-full max-w-5xl h-full max-h-[95vh] rounded-[48px] overflow-hidden flex flex-col shadow-2xl relative border border-white/20"
      >
        {/* Modal Header */}
        <div className="bg-red-600 p-8 md:p-12 text-white flex justify-between items-start relative overflow-hidden shrink-0">
           {/* Decorative background elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-700 rounded-full -ml-24 -mb-24 blur-2xl opacity-30" />
           
           <div className="relative z-10">
              <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 mb-4 inline-block">Official Application Preview</span>
              <h2 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tighter leading-[0.9]">
                {personal.firstName} {personal.middleName ? `${personal.middleName} ` : ''}{personal.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                       <CheckCircleIcon size={14} />
                    </div>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">Application ID: {student.id.slice(0, 12)}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                       <CalendarIcon size={14} />
                    </div>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">Submitted: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
                 </div>
              </div>
           </div>
           
           <button onClick={onClose} className="p-4 bg-white/10 backdrop-blur-md text-white rounded-[20px] hover:bg-white hover:text-red-600 transition-all border border-white/20 relative z-10 active:scale-90">
             <XIcon size={20} strokeWidth={3} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-12 md:space-y-16">
          
          {/* Step 1: Personal Information */}
          <section className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] shrink-0 px-8 py-2 bg-gray-50 rounded-full">Step 1: Personal Identity</h3>
                <div className="h-px flex-1 bg-gray-100" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
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
          <section className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] shrink-0 px-8 py-2 bg-gray-50 rounded-full">Step 2: Educational History</h3>
                <div className="h-px flex-1 bg-gray-100" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                <DataField label="Last Grade Level Completed" value={education.lastGradeLevel} />
                <DataField label="Last School Attended" value={education.lastSchoolAttended} />
                <DataField label="Year Last Attended" value={education.yearLastAttended} />
                <div className="md:col-span-2">
                   <DataField label="Reason for Stopping" value={education.reason} />
                </div>
             </div>
          </section>

          {/* Step 3: Learning Preferences */}
          <section className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] shrink-0 px-8 py-2 bg-gray-50 rounded-full">Step 3: Learning Preferences</h3>
                <div className="h-px flex-1 bg-gray-100" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <DataField label="Preferred Learning Style" value={preferences.learningStyle} />
                <DataField label="Preferred Schedule" value={preferences.preferredSchedule?.replace(/_/g, ' ').toUpperCase()} />
                <DataField label="Preferred Language" value={preferences.preferredLanguage} />
                <div className="md:col-span-3">
                   <DataField label="Special Accommodations" value={preferences.accommodation} />
                </div>
             </div>
          </section>

          {/* Step 4: Available Subjects (Selected) */}
          <section className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] shrink-0 px-8 py-2 bg-gray-50 rounded-full">Step 4: Selected Subjects</h3>
                <div className="h-px flex-1 bg-gray-100" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((s: any) => (
                  <div key={s.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                      <BookOpenIcon size={14} />
                    </div>
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-tight">{s.name}</span>
                  </div>
                ))}
                {subjects.length === 0 && (
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No subjects selected</p>
                )}
             </div>
          </section>

          {/* Step 5: Final Review Status */}
          <section className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] shrink-0 px-8 py-2 bg-gray-50 rounded-full">Step 5: Final Review</h3>
                <div className="h-px flex-1 bg-gray-100" />
             </div>
             <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg ${
                      student.status === 'enrolled' ? 'bg-green-600 text-white shadow-green-600/20' : 
                      student.status === 'rejected' ? 'bg-red-600 text-white shadow-red-600/20' :
                      'bg-amber-500 text-white shadow-amber-600/20'
                   }`}>
                      {student.status === 'enrolled' ? <CheckCircleIcon size={32} /> : 
                       student.status === 'rejected' ? <XIcon size={32} /> : 
                       <ClockIcon size={32} />}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Application State</p>
                      <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{student.status}</h4>
                   </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   <button onClick={onClose} className="flex-1 md:flex-none px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Close Review</button>
                </div>
             </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-8 md:p-10 bg-white border-t border-gray-50 flex justify-center md:justify-end items-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ALS Hamtic Digital Intake Portal v1.0</p>
        </div>
      </motion.div>
    </div>
  );
};

const DataField = ({ label, value, highlight = false }: any) => (
  <div className="space-y-2">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    <p className={`text-md font-black uppercase tracking-tight ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
      {value || <span className="opacity-20 italic">Not Provided</span>}
    </p>
  </div>
);

export default AdminDashboard;