import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  BellIcon, 
  BookOpenIcon, 
  CalendarIcon, 
  UserIcon,
  ChevronRightIcon,
  PhoneIcon,
  MapPinIcon,
  SendIcon,
  MessageSquareIcon,
  DownloadCloudIcon,
  Loader2Icon,
  FileTextIcon,
  MailIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface EnrollmentRecord {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'enrolled';
  personal_info: {
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  learning_preferences: {
    preferredSchedule: string;
    preferredLanguage: string;
  };
  subjects: Array<{ id: number; name: string }>;
  rejection_reason?: string;
  submitted_at: string;
  approved_at?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(true);

    // Student Dashboard Real-time Engine
    if (isSupabaseConfigured) {
      const studentChannel = supabase
        .channel(`student-live-${user.uid}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'inquiries', 
          filter: `user_id=eq.${user.uid}` 
        }, (payload) => {
          if (payload.new.admin_reply !== payload.old?.admin_reply) {
            toast.success("Coordinator replied to your inquiry!", { icon: '💬' });
          }
          fetchDashboardData(false);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'enrollments', 
          filter: `user_id=eq.${user.uid}` 
        }, (payload) => {
          if (payload.new.status !== payload.old?.status) {
            const status = payload.new.status;
            toast.success(`Application Update: Your status is now ${status}!`, { 
              icon: status === 'approved' ? '🎉' : '🔔',
              duration: 5000 
            });
          }
          fetchDashboardData(false);
        })
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'announcements' 
        }, (payload) => {
          toast.success(`New Notice: ${payload.new.title}`, { icon: '📢' });
          fetchDashboardData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(studentChannel);
      };
    }
  }, [user]);

  const fetchDashboardData = async (isFirstTime: boolean = false) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setHasInitialLoaded(true);
      return;
    }

    try {
      if (isFirstTime) setHasInitialLoaded(false);
      setLoading(true);
      // Fetch enrollment
      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user?.uid)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (enrollError) throw enrollError;
      setEnrollment(enrollData);

      // Fetch announcements
      const { data: announceData, error: announceError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (announceError) {
        console.warn('Could not fetch announcements:', announceError);
      } else {
        setAnnouncements(announceData || []);
      }

      // Fetch student inquiries
      const { data: inqData } = await supabase
        .from('inquiries')
        .select('*')
        .eq('user_id', user?.uid)
        .order('created_at', { ascending: false });
      setInquiries(inqData || []);

      // Fetch learning modules
      const { data: modData } = await supabase
        .from('learning_modules')
        .select('*, subjects(name)')
        .eq('is_active', true);
      setModules(modData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setHasInitialLoaded(true);
    }
  };

  const StatusTracker = ({ status, reason }: { status: string, reason?: string }) => {
    const steps = [
      { id: 'submitted', label: 'Received', icon: <MailIcon className="w-5 h-5" />, completed: true },
      { id: 'review', label: 'Under Review', icon: <ClockIcon className="w-5 h-5" />, completed: status !== 'rejected' },
      { id: 'final', label: status === 'approved' || status === 'enrolled' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Final Decision', 
        icon: status === 'approved' || status === 'enrolled' ? <CheckCircleIcon className="w-5 h-5" /> : status === 'rejected' ? <AlertCircleIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />, 
        completed: status !== 'pending' && status !== 'review',
        active: status !== 'pending'
      }
    ];

    return (
      <div className="bg-white rounded-[24px] p-4 sm:p-8 shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <h3 className="text-xl font-black text-gray-900 mb-8 font-display">Application Progress</h3>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center max-w-2xl mx-auto gap-12 md:gap-0 mt-8">
          {/* Progress Line */}
          <div className="absolute top-0 left-6 md:left-0 md:top-1/2 w-1 md:w-full h-full md:h-0.5 bg-gray-100 md:-translate-y-1/2 -z-10" />
          <div 
            className="absolute top-0 left-6 md:left-0 w-1 md:w-full bg-[#0038A8] md:h-0.5 -z-10 transition-all duration-700" 
            style={{ 
              height: status === 'pending' ? '50%' : '100%',
              width: typeof window !== 'undefined' && window.innerWidth < 768 
                ? '4px' 
                : status === 'pending' ? '50%' : '100%',
              top: 0 
            }}
          />

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-row md:flex-col items-center gap-6 md:gap-0 relative z-10 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-xl md:rounded-full shrink-0 flex items-center justify-center border-4 transition-all duration-300 ${
                step.completed 
                  ? step.id === 'final' && status === 'rejected' ? 'bg-red-500 border-red-500 text-white' : 'bg-[#0038A8] border-[#0038A8] text-white' 
                  : 'bg-white border-gray-200 text-gray-500'
              }`}>
                {step.icon}
              </div>
              <div className="flex flex-col md:items-center pt-1 md:pt-4">
                <span className={`text-[11px] md:text-xs font-black uppercase tracking-[0.2em] ${step.completed ? 'text-[#0038A8]' : 'text-gray-500'}`}>
                  {step.label}
                </span>
                {step.id === 'final' && status === 'rejected' && reason && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 text-left md:text-center max-w-[200px]">{reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {status === 'rejected' && reason && (
          <div className="mt-10 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
            <AlertCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-black text-red-900 text-sm uppercase tracking-widest mb-1">Update from Administration</p>
              <p className="text-red-700 font-medium leading-relaxed">{reason}</p>
              <Link to="/enrollment" className="inline-block mt-4 text-sm font-bold text-red-600 hover:underline">
                Re-apply with correct information →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!hasInitialLoaded && loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2Icon className="w-12 h-12 text-[#0038A8] animate-spin mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Syncing with Hamtic HQ...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-[32px] flex items-center justify-center text-red-600 mb-8 border-4 border-white shadow-xl">
          <AlertCircleIcon size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Connection Required</h1>
        <p className="text-gray-600 max-w-md mb-10 font-medium font-body">The Hamtic Systems database is not currently configured. Please contact your administrator to set up the Supabase environment variables.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-8 pb-12">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Dashboard Section */}
          <div className="lg:col-span-2">
            
            {/* Welcome Message */}
            <div className="mb-10">
              <span className="text-[#0038A8] font-bold tracking-[0.2em] uppercase text-xs">
                Malipayon nga Pag-abot! (Welcome)
              </span>
              <h2 className="text-4xl font-black text-gray-900 mt-2 font-display">
                Hello, {enrollment?.personal_info.firstName || user?.displayName?.split(' ')[0] || 'Learner'}
              </h2>
            </div>

            {/* Tab Navigation */}
            {enrollment && enrollment.status === 'enrolled' && (
              <div className="flex gap-4 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {['overview', 'materials', 'support'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab ? 'bg-white text-[#0038A8] shadow-sm' : 'text-gray-500 hover:text-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {!enrollment ? (
              /* No Enrollment View */
              <div className="bg-[#0038A8] rounded-[32px] p-6 sm:p-10 text-white shadow-xl shadow-blue-900/10 overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-4 font-display">Join the ALS Family Today!</h3>
                  <p className="text-blue-100 font-medium mb-8 max-w-md leading-relaxed">
                    Start your educational journey with us. Our flexible learning programs are designed to fit your life.
                  </p>
                  <Link to="/enrollment" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0038A8] font-black rounded-2xl hover:scale-105 transition-all shadow-lg hover:bg-blue-50">
                    Fill Out Enrollment Form <ChevronRightIcon className="w-5 h-5" />
                  </Link>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"></div>
              </div>
            ) : enrollment.status === 'pending' || enrollment.status === 'rejected' ? (
              /* Application Tracker View */
              <StatusTracker status={enrollment.status} reason={enrollment.rejection_reason} />
            ) : activeTab === 'overview' ? (
              /* Admitted Student Portal View */
              <div className="space-y-8">
                {/* Student ID Card Overlay (already exists in original code) */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-[#0038A8] px-8 py-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">Official Learner Dossier</span>
                    <span className="text-[10px] font-black text-white tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full border border-white/20">Active Enrollment</span>
                  </div>
                  <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-32 h-32 rounded-3xl bg-gray-50 flex items-center justify-center text-[#0038A8] relative overflow-hidden shrink-0 border-4 border-gray-50">
                      <UserIcon className="w-16 h-16" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#0038A8]/5 to-transparent"></div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-[10px] font-black text-[#0038A8] uppercase tracking-widest mb-1">Student Admitted ID</p>
                      <h3 className="text-3xl font-black text-gray-900 font-display">STU-{enrollment.id.substring(0, 8).toUpperCase()}</h3>
                      <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-8">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Strand</p>
                          <p className="font-bold text-gray-700">Junior High - ALS</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Center</p>
                          <p className="font-bold text-gray-700">Hamtic Central CLC</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0038A8] shrink-0">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Your Schedule</h4>
                      <p className="text-gray-600 font-bold leading-relaxed">
                        {enrollment.learning_preferences.preferredSchedule.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 italic">* Please coordinate with your teacher for room assignment.</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                      <BookOpenIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Enrolled Subjects</h4>
                      <div className="flex flex-wrap gap-2">
                        {enrollment.subjects?.map((s, i) => (
                           <span key={i} className="px-3 py-1 bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-100">{s.name}</span>
                        )) || <p className="text-gray-500 text-sm">Awaiting assignment...</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'materials' ? (
              <div className="space-y-6">
                 <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <h3 className="text-2xl font-black font-display mb-2">Learning Materials</h3>
                    <p className="text-sm text-gray-500 font-medium tracking-wide border-b border-gray-50 pb-6 mb-8 uppercase">Download digital ALS modules for your strand</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {modules.length === 0 ? (
                         <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl">
                            <BookOpenIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No materials uploaded for your strand yet.</p>
                         </div>
                       ) : (
                         modules.map((mod) => (
                           <div key={mod.id} className="p-6 bg-gray-50 rounded-[24px] group hover:bg-[#0038A8] transition-all duration-300 flex items-center justify-between border border-transparent hover:shadow-xl hover:shadow-blue-900/10 active:scale-[0.98]">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0038A8] group-hover:scale-110 transition-transform shadow-sm">
                                    <FileTextIcon className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-gray-900 group-hover:text-white transition-colors text-sm uppercase truncate max-w-[150px]">{mod.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 group-hover:text-blue-200 transition-colors uppercase tracking-widest">ALS Module • PDF</p>
                                 </div>
                              </div>
                              <a 
                                href={mod.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0038A8] hover:scale-110 transition-all shadow-sm"
                              >
                                 <DownloadCloudIcon className="w-5 h-5" />
                              </a>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Inquiry Form */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm order-2 md:order-1">
                       <h3 className="text-xl font-black font-display mb-6 uppercase tracking-tight">Need Help?</h3>
                       <form onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const subject = formData.get('subject') as string;
                          const message = formData.get('message') as string;
                          
                          if (!subject || !message) return toast.error('Please fill in all fields');
                          
                          setSubmittingInquiry(true);
                          try {
                             const { error } = await supabase.from('inquiries').insert({
                                user_id: user?.uid,
                                subject,
                                message,
                                status: 'open'
                             });
                             if (error) throw error;
                             toast.success('Inquiry sent successfully!');
                             (e.target as HTMLFormElement).reset();
                             fetchDashboardData();
                          } catch (err) {
                             toast.error('Failed to send inquiry');
                          } finally {
                             setSubmittingInquiry(false);
                          }
                       }} className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Topic / Subject</label>
                             <input name="subject" required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0038A8] font-bold text-sm" placeholder="e.g. Schedule Clarification" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Message</label>
                             <textarea name="message" required rows={4} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0038A8] font-medium text-sm" placeholder="Describe your concern here..." />
                          </div>
                          <button 
                             disabled={submittingInquiry}
                             className="w-full py-4 bg-[#0038A8] text-white font-black rounded-2xl shadow-lg shadow-blue-900/10 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                             {submittingInquiry ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <><SendIcon className="w-4 h-4" /> Send Inquiry</>}
                          </button>
                       </form>
                    </div>

                    {/* Chat History */}
                    <div className="space-y-6 order-1 md:order-2">
                       <h3 className="text-xl font-black font-display uppercase tracking-tight px-2">Your Conversations</h3>
                       <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {inquiries.length === 0 ? (
                             <div className="p-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <MessageSquareIcon className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase">No messages yet.</p>
                             </div>
                          ) : (
                             inquiries.map((inq) => (
                                <div key={inq.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                   <div className="flex justify-between items-start mb-3">
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${inq.status === 'open' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                         {inq.status}
                                      </span>
                                      <p className="text-[10px] font-bold text-gray-500">{new Date(inq.created_at).toLocaleDateString()}</p>
                                   </div>
                                   <h4 className="font-black text-gray-900 text-sm mb-4">{inq.subject}</h4>
                                   
                                   {inq.admin_reply && (
                                      <div className="mt-4 pt-4 border-t border-gray-50 bg-blue-50/30 p-4 rounded-2xl">
                                         <p className="text-[10px] font-black text-[#0038A8] uppercase tracking-widest mb-2">Admin Reply</p>
                                         <p className="text-xs font-bold text-gray-700 italic">"{inq.admin_reply}"</p>
                                      </div>
                                   )}
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Notice Board */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <BellIcon className="w-6 h-6 text-[#0038A8]" />
                <h3 className="text-xl font-black text-gray-900 font-display">Notice Board</h3>
              </div>

              <div className="space-y-6">
                {announcements.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10 font-medium italic">No announcements today.</p>
                ) : (
                  announcements.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-3xl border-l-[6px] relative overflow-hidden transition-all hover:bg-gray-50 ${
                        item.priority === 'high' ? 'border-red-500 bg-red-50/10' : 
                        item.priority === 'medium' ? 'border-yellow-500 bg-yellow-50/10' : 
                        'border-blue-300 bg-blue-50/5'
                      }`}
                    >
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      <h4 className="font-black text-gray-900 text-lg mb-2 leading-tight">{item.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.message}</p>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-50">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Support & Contact</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <MailIcon className="w-4 h-4 text-[#0038A8]" />
                    <span>hamtic.als@deped.gov.ph</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <PhoneIcon className="w-4 h-4 text-[#0038A8]" />
                    <span>+63 912 345 6789</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <MapPinIcon className="w-4 h-4 text-[#0038A8]" />
                    <span>Hamtic Central, Antique</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
