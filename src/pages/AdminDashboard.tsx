import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpenIcon, CalendarIcon, BellIcon, FileTextIcon, SettingsIcon, LogOutIcon, 
  ChevronDownIcon, CheckCircleIcon, ClockIcon, UsersIcon, PlusCircleIcon, 
  BarChart2Icon, GridIcon, SearchIcon, TrashIcon, EditIcon, EyeIcon, 
  DownloadIcon, HistoryIcon, AlertTriangleIcon, InfoIcon, MapPinIcon, MenuIcon, XIcon
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
  const [formData, setFormData] = useState<any>({});
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-lg border border-gray-100"
      >
        <h2 className="text-3xl font-black mb-8 font-display uppercase tracking-tighter text-gray-900">{title}</h2>
        <div className="space-y-6">
          {fields.map((f: any) => (
            <div key={f.name} className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all font-medium text-sm" 
                  rows={4}
                  placeholder={f.placeholder}
                  onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                />
              ) : (
                <input 
                  type={f.type || 'text'}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all font-bold text-sm"
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
    students, subjects, announcements, loading: contextLoading, error: contextError, 
    updateStudent, deleteStudent, 
    addSubject, updateSubject, deleteSubject,
    addAnnouncement, refreshData
  } = useDataContext();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);

  // Forms Visibility
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [editAnnounce, setEditAnnounce] = useState<any | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [promptModal, setPromptModal] = useState<{ title: string; fields: any[]; onSubmit: (data: any) => void } | null>(null);
  const [isPromptSubmitting, setIsPromptSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardSpecificData();
    fetchLogs(1);

    // Admin Real-time Inquiry Alert
    if (isSupabaseConfigured) {
      const inquiryChannel = supabase
        .channel('admin-inbox-alerts')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'inquiries' 
        }, (payload) => {
          toast.success(`New Message: ${payload.new.subject}`, { 
            icon: '📩', 
            duration: 5000 
          });
          refreshData(); // Refresh global context
          fetchDashboardSpecificData(); // Refresh local secondary data
        })
        .subscribe();

      return () => {
        supabase.removeChannel(inquiryChannel);
      };
    }
  }, []);

  const fetchDashboardSpecificData = async () => {
    if (!isSupabaseConfigured) {
      setIsDataLoading(false);
      return;
    }
    setIsDataLoading(true);
    try {
      const [schRes, assessRes, inqRes, modRes] = await Promise.all([
        supabase.from('schedules').select('*, subjects(name)').order('created_at', { ascending: false }),
        supabase.from('assessments').select('*, enrollments(personal_info)').order('created_at', { ascending: false }),
        supabase.from('inquiries').select('*, enrollments(personal_info)').order('created_at', { ascending: false }),
        supabase.from('learning_modules').select('*, subjects(name)').order('created_at', { ascending: false })
      ]);

      setSchedules(schRes.data || []);
      setAssessments(assessRes.data || []);
      setInquiries(inqRes.data || []);
      setModules(modRes.data || []);
    } catch (err) {
      console.error('Error fetching secondary admin data:', err);
      toast.error('Failed to sync system data');
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchLogs = async (page: number) => {
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('Could not load logs');
      return;
    }

    if (page === 1) setAuditLogs(data || []);
    else setAuditLogs([...auditLogs, ...(data || [])]);
    
    setHasMoreLogs(data?.length === limit);
    setLogPage(page);
  };

  // Handlers
  const handleAddStudent = () => { setEditStudent(null); setShowStudentForm(true); };
  const handleEditStudent = (s: Student) => { setEditStudent(s); setShowStudentForm(true); };
  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this student record? This action cannot be undone.')) {
      deleteStudent(id);
    }
  };

  const handleAddSubject = () => { setEditSubject(null); setShowSubjectForm(true); };
  const handleEditSubject = (s: Subject) => { setEditSubject(s); setShowSubjectForm(true); };
  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Delete this strand?')) deleteSubject(id);
  };

  const handleAddAnnouncement = () => { setEditAnnounce(null); setShowAnnounceForm(true); };
  const handleEditAnnounce = (ann: any) => { setEditAnnounce(ann); setShowAnnounceForm(true); };
  const handleDeleteAnnounce = async (id: string) => {
    if (!window.confirm('Delete notice?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
       toast.error('Failed to remove notice');
    } else {
       toast.success('Notice removed');
       refreshData(); // DataContext handles the update
    }
  };

  const handleAnnounceSubmit = async (data: any) => {
    const { id, ...payload } = data;
    try {
      if (id) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Notice updated');
      } else {
        await addAnnouncement(payload);
        toast.success('Notice posted');
      }
      setShowAnnounceForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
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
      head: [['ID', 'Name', 'Email', 'Strand', 'Status']],
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
            { id: 'students', name: 'Learners', icon: <UsersIcon size={20} /> },
            { id: 'announcements', name: 'Notices', icon: <BellIcon size={20} /> },
            { id: 'schedule', name: 'Schedule', icon: <CalendarIcon size={20} /> },
            { id: 'assessments', name: 'Grading', icon: <FileTextIcon size={20} /> },
            { id: 'inquiries', name: 'Messages', icon: <InfoIcon size={20} /> },
            { id: 'modules', name: 'Materials', icon: <BookOpenIcon size={20} /> },
            { id: 'reports', name: 'Audit Logs', icon: <HistoryIcon size={20} /> },
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
                <StatCard icon={<UsersIcon className="text-red-700" />} title="Total Enrollees" value={students.length} change="+12.5%" color="bg-red-50" />
                <StatCard icon={<BookOpenIcon className="text-red-700" />} title="Active Strands" value={subjects.length} change="Stable" color="bg-red-50" />
                <StatCard icon={<BellIcon className="text-red-700" />} title="New Applications" value={students.filter(s => s.status === 'Pending').length} change="Priority" color="bg-red-50 shadow-sm border border-red-100" />
                <StatCard icon={<CheckCircleIcon className="text-red-700" />} title="Graduates" value={students.filter(s => s.status === 'Graduated').length} change="+4" color="bg-red-50" />
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
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Learner Information</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Academic Strand</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Current Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 5).map(s => (
                          <tr key={s.id} className="border-t border-gray-50 group/row hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                              <p className="text-sm font-black text-gray-900 leading-tight mb-0.5">{s.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold tabular-nums">ID: {s.id}</p>
                            </td>
                            <td className="py-4">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span className="text-xs font-black text-gray-600 uppercase tracking-tight">{s.subjects || 'NOT_ASSIGNED'}</span>
                               </div>
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                s.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
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
                              <p className="text-sm font-black text-gray-900">{s.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Lrn: {s.personal_info?.lrn || 'N/A'}</p>
                           </div>
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                s.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>{s.status}</span>
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
                     <h3 className="text-lg font-black mb-2">Broadcast Notice</h3>
                     <p className="text-red-100 text-sm mb-6 font-medium">Instantly notify all students about holidays or deadlines.</p>
                     <button onClick={handleAddAnnouncement} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-sm hover:bg-red-50 transition-all active:scale-95 shadow-lg">New Broadcast</button>
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
          )}

          {activeSidebarItem === 'students' && (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">Master Registry</h3>
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Total: {filteredStudents.length} Learners</p>
                </div>
                <div className="flex gap-4">
                  <select 
                    value={selectedFilter}
                    onChange={e => setSelectedFilter(e.target.value)}
                    className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <button onClick={handleAddStudent} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-600/20 hover:scale-105 transition-all text-sm">Add New Student</button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-x-auto hidden md:block">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50/50">
                    <tr className="text-left">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">ID Sequence</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Full Legal Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-none">Strand</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-none">Learning Progress</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">System Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group/row">
                        <td className="px-6 py-6 text-sm tabular-nums text-gray-400">{s.id}</td>
                        <td className="px-6 py-6 border-l-4 border-red-500 text-sm font-black text-gray-900">{s.name}</td>
                        <td className="px-6 py-6 text-center text-xs text-gray-500 uppercase tracking-wide font-black italic">{s.subjects || '---'}</td>
                        <td className="px-6 py-6">
                           <div className="w-24 h-2 bg-gray-100 rounded-full mx-auto relative overflow-hidden">
                              <div className="absolute inset-0 bg-red-600 transition-all duration-1000" style={{ width: `${s.progress}%` }}></div>
                           </div>
                           <p className="text-[10px] text-center mt-1.5 text-gray-400 font-black tabular-nums">{s.progress}%</p>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`px-3 py-1 text-[10px] rounded-lg font-black uppercase tracking-widest shadow-sm border ${
                            s.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>{s.status}</span>
                        </td>
                        <td className="px-6 py-6 text-right space-x-1">
                           <button onClick={() => handleEditStudent(s)} className="p-2.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"><EditIcon size={16} /></button>
                           <button onClick={() => handleDeleteStudent(s.id)} className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><TrashIcon size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Mobile-First Card List */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredStudents.map(s => (
                  <div key={s.id} className="p-5 flex flex-col gap-4 group active:bg-gray-50 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-black text-xs tabular-nums">
                          {s.id.toString().slice(-2)}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 leading-tight">{s.name}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.subjects || 'NOT_ASSIGNED'}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                        s.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                      }`}>{s.status}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-6 px-1">
                      <div className="flex-1">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full" style={{ width: `${s.progress}%` }}></div>
                        </div>
                        <p className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-widest">{s.progress}% Completion</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleEditStudent(s)} className="p-3 bg-gray-50 text-blue-600 rounded-2xl active:bg-blue-100 transition-all shadow-sm border border-gray-100"><EditIcon size={16} /></button>
                         <button onClick={() => handleDeleteStudent(s.id)} className="p-3 bg-gray-50 text-red-600 rounded-2xl active:bg-red-100 transition-all shadow-sm border border-gray-100"><TrashIcon size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'announcements' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-3xl font-black tracking-tighter uppercase font-display">Notices & Broadcasts</h2>
                   <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Communication Center</p>
                </div>
                <button onClick={handleAddAnnouncement} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm">Post New Alert</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {dbAnnouncements.map(ann => (
                    <div key={ann.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col group hover:border-red-500 transition-all duration-500">
                       <div className="flex justify-between items-start mb-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            ann.priority === 'high' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-50 text-blue-600'
                          }`}>{ann.priority}</span>
                          <div className="flex gap-2">
                             <button onClick={() => handleEditAnnounce(ann)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><EditIcon size={16} className="text-gray-300 group-hover:text-blue-600" /></button>
                             <button onClick={() => handleDeleteAnnounce(ann.id)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><TrashIcon size={16} className="text-gray-300 group-hover:text-red-600" /></button>
                          </div>
                       </div>
                       <h3 className="text-xl font-black mb-4 group-hover:text-red-600 transition-colors uppercase leading-[0.9]">{ann.title}</h3>
                       <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">{ann.message}</p>
                       <div className="mt-auto pt-6 border-t border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          {new Date(ann.created_at).toLocaleDateString()} @ {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'schedule' && (
            <div className="space-y-10">
               <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Schedules</h2>
                  <button onClick={() => toast.error('Schedule Creator coming in next sync!')} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm">Create New Slot</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {schedules.map(sch => (
                     <div key={sch.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:scale-[1.02] transition-all duration-300">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                           <CalendarIcon size={24} />
                        </div>
                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-1">{sch.subjects?.name || 'Assigned Strand'}</h4>
                        <h3 className="text-2xl font-black text-gray-900 mb-6 font-display leading-none">{sch.day_of_week}</h3>
                        
                        <div className="space-y-4">
                           <div className="flex items-center gap-4 text-sm font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl">
                              <ClockIcon className="text-red-600 w-4 h-4" />
                              <span>{sch.time_start} - {sch.time_end}</span>
                           </div>
                           <div className="flex items-center gap-4 text-sm font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl">
                              <MapPinIcon className="text-red-600 w-4 h-4" />
                              <span className="truncate">{sch.location}</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activeSidebarItem === 'assessments' && (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-10 border-b border-gray-50">
                  <h2 className="text-2xl font-black font-display uppercase tracking-tight">Gradebook Registry</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Official Module Assessment Records</p>
               </div>
               <div className="p-10 overflow-x-auto">
                 <table className="w-full min-w-[1000px]">
                     <thead>
                        <tr className="text-left border-b border-gray-100 pb-4">
                           <th className="px-6 pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Learner</th>
                           <th className="px-6 pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Module Name</th>
                           <th className="px-6 pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Score</th>
                           <th className="px-6 pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Result</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {assessments.map(ass => (
                           <tr key={ass.id}>
                              <td className="px-6 py-8">
                                 <p className="text-sm font-bold text-gray-900">{ass.enrollments?.personal_info?.firstName} {ass.enrollments?.personal_info?.lastName}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Learner</p>
                              </td>
                              <td className="px-6 py-8 text-sm font-bold text-gray-500 uppercase">{ass.module_name}</td>
                              <td className="px-6 py-8 text-center tabular-nums">
                                 <p className="text-xl font-black text-gray-900">{ass.score}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">Points of {ass.max_score}</p>
                              </td>
                              <td className="px-6 py-8">
                                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    ass.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                 }`}>{ass.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeSidebarItem === 'analytics' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8">Strand Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjects.map(s => ({ name: s.name, value: students.filter(st => st.subjects === s.name).length }))}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {subjects.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8">Enrollment Status</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={['Active', 'Pending', 'Graduated'].map(s => ({ name: s, count: students.filter(st => st.status === s).length }))}>
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

          {activeSidebarItem === 'inquiries' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Student Inquiry Inbox</h2>
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-xs font-black uppercase">
                  {inquiries.filter(i => i.status === 'open').length} Unread Messages
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {inquiries.map(inq => (
                  <div key={inq.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm group hover:border-red-600 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          <UsersIcon size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm">{inq.subject}</h4>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">From: {inq.enrollments?.personal_info?.firstName || 'Student'}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${inq.status === 'open' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 bg-gray-50 p-4 rounded-2xl font-medium">{inq.message}</p>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => {
                        setPromptModal({
                          title: 'Inquiry Response',
                          fields: [
                            { name: 'reply', label: 'Your Reply', type: 'textarea', placeholder: 'Enter your response to the student...' }
                          ],
                          onSubmit: async (data) => {
                            if (!data.reply) return;
                            setIsPromptSubmitting(true);
                            const { error } = await supabase.from('inquiries').update({ 
                              admin_reply: data.reply, 
                              status: 'replied', 
                              replied_at: new Date().toISOString() 
                            }).eq('id', inq.id);
                            
                            if (!error) {
                              // Insert persistent notification for the student
                              await supabase.from('notifications').insert({
                                user_id: inq.user_id,
                                message: `New reply from coordinator: "${data.reply.substring(0, 40)}${data.reply.length > 40 ? '...' : ''}"`,
                                is_read: false
                              });
                              toast.success('Reply sent!');
                              fetchDashboardSpecificData();
                            } else {
                              toast.error('Could not send reply');
                            }
                            setIsPromptSubmitting(false);
                            setPromptModal(null);
                          }
                        });
                      }} className="px-6 py-2 bg-red-600 text-white font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Reply</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'modules' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Module Repository</h2>
                <button onClick={() => {
                  setPromptModal({
                    title: 'New Learning Module',
                    fields: [
                      { name: 'title', label: 'Module Title', placeholder: 'e.g. LS1: Communication Skills' },
                      { name: 'url', label: 'File URL', placeholder: 'Paste Supabase/Google Drive link' }
                    ],
                    onSubmit: async (data) => {
                      if (!data.title || !data.url) return;
                      setIsPromptSubmitting(true);
                      const { error } = await supabase.from('learning_modules').insert({ title: data.title, file_url: data.url });
                      if (!error) {
                        toast.success('Module added!');
                        fetchDashboardSpecificData();
                      } else {
                        toast.error('Failed to upload module');
                      }
                      setIsPromptSubmitting(false);
                      setPromptModal(null);
                    }
                  });
                }} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest">Upload Module</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map(mod => (
                  <div key={mod.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative group overflow-hidden">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 font-black italic">
                      PDF
                    </div>
                    <h3 className="font-black text-gray-900 mb-2 truncate uppercase text-sm">{mod.title}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-6">{mod.subjects?.name || 'General Strand'}</p>
                    <div className="flex gap-2">
                       <button className="flex-1 py-2 bg-gray-50 text-gray-400 font-bold rounded-xl text-[10px] uppercase hover:bg-gray-100 transition-all">Edit</button>
                       <button onClick={async () => {
                         if(confirm('Archive module?')) {
                           await supabase.from('learning_modules').delete().eq('id', mod.id);
                           fetchAllData();
                         }
                       }} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"><TrashIcon size={14} /></button>
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
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Systems Audit</h2>
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
                              <p className="text-xs font-medium text-gray-500 mt-1">Target ID: <span className="font-bold text-gray-900">{log.target_id || 'Global'}</span></p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</p>
                           <p className="text-lg font-black text-gray-300 group-hover:text-red-600 transition-colors tabular-nums">
                             {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                  ))}
                  
                  {hasMoreLogs && (
                    <div className="pt-10 text-center">
                      <button 
                        onClick={() => fetchLogs(logPage + 1)}
                        className="px-12 py-4 bg-gray-50 text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-all text-[11px] uppercase tracking-widest border border-gray-100 shadow-sm"
                      >
                        Load More Logs
                      </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Form Modals */}
          {showAnnounceForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-xl border border-gray-100">
                <h2 className="text-3xl font-black mb-10 font-display uppercase tracking-tighter">Broadcast Center</h2>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Notice Title</label>
                    <input 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all font-black" 
                      defaultValue={editAnnounce?.title}
                      id="ann-title"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['low', 'medium', 'high'].map(p => (
                         <button 
                           key={p} 
                           type="button"
                           onClick={() => {(document.getElementById('ann-priority') as any).value = p}}
                           className="py-3 px-4 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all focus:bg-red-600 focus:text-white"
                         >{p}</button>
                       ))}
                       <input type="hidden" id="ann-priority" defaultValue={editAnnounce?.priority || 'medium'} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message Body</label>
                    <textarea 
                      rows={6} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-600/10 transition-all text-sm font-medium" 
                      defaultValue={editAnnounce?.message}
                      id="ann-msg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-6 mt-12 pt-8 border-t border-gray-50">
                  <button className="text-sm font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest" onClick={() => setShowAnnounceForm(false)}>Discard</button>
                  <button 
                    className="px-10 py-4 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                    onClick={() => handleAnnounceSubmit({
                      id: editAnnounce?.id,
                      title: (document.getElementById('ann-title') as any).value,
                      message: (document.getElementById('ann-msg') as any).value,
                      priority: (document.getElementById('ann-priority') as any).value
                    })}
                  >
                    Publish News
                  </button>
                </div>
              </div>
            </div>
          )}

           {showStudentForm && <StudentModal initial={editStudent} onSubmit={async (s: any) => { 
            if(editStudent) {
              updateStudent(editStudent.id, s);
              if (s.status !== editStudent.status) {
                // Persistent Notification
                await supabase.from('notifications').insert({
                  user_id: editStudent.id, // Assuming student.id is their user_id
                  message: `Your application status has been updated to ${s.status}.`,
                  is_read: false
                });
                await sendStatusEmail(s.name, s.email, s.status);
              }
            } else addStudent(s); 
            setShowStudentForm(false); 
          }} onCancel={() => setShowStudentForm(false)} />}
          {showSubjectForm && <SubjectModal initial={editSubject} onSubmit={(s) => { if(editSubject) updateSubject(editSubject.id, s); else addSubject(s); setShowSubjectForm(false); }} onCancel={() => setShowSubjectForm(false)} />}
          
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

// Internal Modal Components for Learners/Strands
const StudentModal = ({ initial, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initial || { id: '', name: '', email: '', status: 'Active', progress: 0 });
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-xl">
        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Learner Identity Card</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
            <input className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-red-600 font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Unique ID</label>
            <input className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-red-600 font-bold tabular-nums" value={form.id} onChange={e => setForm({...form, id: e.target.value})} disabled={!!initial} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
            <input className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-red-600 font-bold" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
        </div>
        <div className="flex justify-end gap-6 mt-12 pt-8 border-t border-gray-50">
          <button className="text-sm font-black text-gray-400 uppercase tracking-widest" onClick={onCancel}>Cancel</button>
          <button className="px-10 py-4 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest" onClick={() => onSubmit(form)}>Save Learner</button>
        </div>
      </div>
    </div>
  );
};

const SubjectModal = ({ initial, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initial || { id: '', name: '', capacity: 25 });
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Strand Config</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Strand Name</label>
            <input className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-red-600 font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacity</label>
            <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-red-600 font-bold" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} />
          </div>
        </div>
        <div className="flex justify-end gap-6 mt-12 pt-8 border-t border-gray-50">
          <button className="text-sm font-black text-gray-400 uppercase tracking-widest" onClick={onCancel}>Cancel</button>
          <button className="px-10 py-4 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest" onClick={() => onSubmit(form)}>Update Strand</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;