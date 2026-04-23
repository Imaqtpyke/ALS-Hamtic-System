import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  AlertCircleIcon, 
  MegaphoneIcon, 
  BookOpenIcon, 
  CalendarIcon, 
  UserIcon,
  ChevronRightIcon,
  PhoneIcon,
  MapPinIcon,
  Loader2Icon,
  MailIcon,
  GraduationCapIcon,
  BrainIcon,
  EyeOffIcon,
  MessageCircleIcon
} from 'lucide-react';
import { useDataContext } from '../DataContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { LockIcon } from 'lucide-react';

interface EnrollmentRecord {
  id: string;
  personal_info: {
    firstName: string;
    lastName: string;
    middleName?: string;
    birthdate: string;
    gender: string;
    address: string;
    addressBarangay: string;
    addressCity: string;
    addressProvince: string;
    phone: string;
    email: string;
  };
  educational_background: {
    lastGradeLevel: string;
    lastSchoolAttended: string;
    yearLastAttended: string;
    reason: string;
  };
  learning_preferences: {
    preferredSchedule: string;
    learningStyle: string;
    accommodation: string;
  };
  subjects: Array<{ id: number; name: string }>;
  rejection_reason?: string;
  submitted_at: string;
  approved_at?: string;
  status: 'pending' | 'approved' | 'rejected' | 'enrolled';
  status_history?: Array<{
    status: string;
    date: string;
    notes: string;
    updated_by: string;
  }>;
}


const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const { profiles, announcements, subjects } = useDataContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [unreadMessage, setUnreadMessage] = useState<any>(null);

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
          table: 'enrollments', 
          filter: `user_id=eq.${user.uid}` 
        }, (payload) => {
          if (payload.new.status !== payload.old?.status) {
            const status = payload.new.status;
            toast.success(`Update: Your application is now ${status}.`, { 
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
          toast.success(`New Announcement: ${payload.new.title}`, { icon: '📢' });
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

      // Check blocked status
      const userProfile = profiles.find(p => p.id === user?.uid);
      if (userProfile?.is_blocked) {
        setIsAccountBlocked(true);
        setBlockReason(userProfile.block_reason || 'No reason provided');
      }

      // Fetch unread message for banner (only if pending)
      let msgData = null;
      if (enrollData?.status === 'pending') {
        const { data } = await supabase
          .from('admin_messages')
          .select('*')
          .eq('user_id', user?.uid)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        msgData = data;
      }
      
      setUnreadMessage(msgData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setHasInitialLoaded(true);
    }
  };

  const scheduleDisplay = (raw: string) => {
    const schedules: Record<string, string> = {
      'monday_hamtic': 'Monday - Hamtic Central School CLC (7:00 AM - 4:30 PM)',
      'tuesday_hamtic': 'Tuesday - Hamtic Central School CLC (7:30 AM - 4:30 PM)',
      'wednesday_bongbongan': 'Wednesday - Bongbongan II Elementary School CLC (7:30 AM - 4:30 PM)',
      'thursday_hamtic': 'Thursday - Hamtic Central School CLC (7:30 AM - 4:30 PM)',
      'friday_lapaz': 'Friday - Lapaz Elementary School CLC (7:30 AM - 4:30 PM)',
    };

    const key = raw.toLowerCase();
    if (schedules[key]) return schedules[key];

    // Fallback for unrecognized values
    return raw.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const StatusTracker = ({ status, reason }: { status: string, reason?: string }) => {
    const steps = [
      { id: 'submitted', label: 'Received', icon: <MailIcon className="w-5 h-5" />, completed: true },
      { id: 'final', label: status === 'approved' || status === 'enrolled' ? 'Approved' : status === 'rejected' ? 'Not Accepted' : 'Result', 
        icon: status === 'approved' || status === 'enrolled' ? <CheckCircleIcon className="w-5 h-5" /> : status === 'rejected' ? <AlertCircleIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />, 
        completed: status !== 'pending',
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

  if (isAccountBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-red-600 rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-red-600/20">
          <LockIcon size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Account Restricted</h1>
        <p className="text-gray-600 max-w-md mb-10 font-bold font-sans">Your access to the ALS Hamtic Portal has been temporarily restricted by the administration.</p>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 max-w-md mb-10">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Reason for Restriction</p>
          <p className="text-sm font-bold text-red-900 italic">"{blockReason}"</p>
        </div>
        <a href="mailto:hamtic.als@deped.gov.ph" className="text-sm font-black text-red-600 hover:underline uppercase tracking-widest">Contact Coordinator Support</a>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#F9F9F9] pt-8 pb-12 text-sans">
      {/* Action Required Banner */}
      {enrollment?.status === 'pending' && unreadMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[32px] shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                <MessageCircleIcon className="w-7 h-7" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight mb-1">Action Required</h3>
                <p className="text-amber-800 font-bold text-sm leading-relaxed max-w-2xl">
                  Admin: "{unreadMessage.message}"
                </p>
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-2">
                  Please update your application to proceed with enrollment.
                </p>
              </div>

              <Link 
                to="/enrollment" 
                className="px-8 py-3 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95 text-xs uppercase tracking-widest whitespace-nowrap"
              >
                Update My Application
              </Link>
            </div>

            {/* Decorative Pulse Background */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -z-0"></div>
          </motion.div>
        </div>
      )}

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
            {enrollment && (enrollment.status === 'enrolled' || enrollment.status === 'approved') && (
              <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'profile', label: 'My Profile' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id ? 'bg-white text-[#0038A8] shadow-sm' : 'text-gray-500 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
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
            ) : (
              /* Admitted Student Portal View */
              <div className="space-y-8">
                {/* Welcome Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center text-[#0038A8] shrink-0">
                      <UserIcon className="w-12 h-12" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-black text-gray-900 font-display">
                        {enrollment.personal_info.firstName} {enrollment.personal_info.lastName}
                      </h3>
                      <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-3 items-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-black uppercase tracking-widest">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Enrolled
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-xl">
                          <BookOpenIcon size={14} className="opacity-80" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{subjects.length} Subjects</span>
                        </div>
                        {enrollment.approved_at && (
                          <span className="text-xs text-gray-500 font-medium">
                            Approved on {new Date(enrollment.approved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Card 1: Schedule */}
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0038A8] shrink-0">
                          <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">My Schedule</h4>
                          <p className="text-gray-700 font-bold leading-relaxed">
                            {scheduleDisplay(enrollment.learning_preferences.preferredSchedule)}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 italic">* Please coordinate with your teacher for room assignment.</p>
                        </div>
                      </div>

                      {/* Card 2: Subjects */}
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                          <BookOpenIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Enrolled Subjects</h4>
                          <div className="flex flex-wrap gap-2">
                            {subjects.length > 0 ? (
                               subjects.map((s, i) => (
                                  <span key={i} className="px-3 py-1 bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-100 uppercase">{s.name}</span>
                               ))
                            ) : (
                               <p className="text-gray-500 font-bold italic">Curriculum being finalized</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MY PROFILE TAB ── */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Card 3: Learning Preferences */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <BrainIcon className="w-6 h-6" />
                      </div>
                      <div className="w-full">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Learning Preferences</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Preferred Learning Style</p>
                            <p className="font-bold text-gray-700">{enrollment.learning_preferences.learningStyle || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Special Accommodations</p>
                            <p className="font-bold text-gray-700">{enrollment.learning_preferences.accommodation || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Educational Background */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                        <GraduationCapIcon className="w-6 h-6" />
                      </div>
                      <div className="w-full">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Educational Background</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Last Grade Level Completed</p>
                            <p className="font-bold text-gray-700 uppercase">{enrollment.educational_background?.lastGradeLevel || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Last School Attended (please input the full name of the school)</p>
                            <p className="font-bold text-gray-700 uppercase">{enrollment.educational_background?.lastSchoolAttended || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Year Last Attended</p>
                            <p className="font-bold text-gray-700">{enrollment.educational_background?.yearLastAttended || '—'}</p>
                          </div>
                        </div>
                        {enrollment.educational_background?.reason && (
                          <div className="pt-4 border-t border-gray-50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Reason for leaving school</p>
                            <p className="text-gray-700 font-medium italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                              "{enrollment.educational_background.reason}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 5: Personal Details */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div className="w-full">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</p>
                            <p className="font-bold text-gray-700 uppercase">
                              {enrollment.personal_info.firstName}{enrollment.personal_info.middleName ? ` ${enrollment.personal_info.middleName}` : ''} {enrollment.personal_info.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gender</p>
                            <p className="font-bold text-gray-700 uppercase">{enrollment.personal_info.gender || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Birthdate</p>
                            <p className="font-bold text-gray-700">
                              {enrollment.personal_info.birthdate
                                ? new Date(enrollment.personal_info.birthdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Address</p>
                            <p className="font-bold text-gray-700 uppercase leading-snug">
                              {[enrollment.personal_info.addressBarangay, enrollment.personal_info.addressCity, enrollment.personal_info.addressProvince].filter(Boolean).join(', ') || '—'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <EyeOffIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-[9px] text-gray-400 font-medium tracking-tight">Only visible to you</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Contact Number</p>
                            <p className="font-bold text-gray-700">{enrollment.personal_info.phone || '—'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <EyeOffIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-[9px] text-gray-400 font-medium tracking-tight">Only visible to you</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</p>
                            <p className="font-bold text-gray-700">{enrollment.personal_info.email || '—'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <EyeOffIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-[9px] text-gray-400 font-medium tracking-tight">Only visible to you</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-8 text-[10px] text-gray-400 font-medium italic border-t border-gray-50 pt-4">
                          To update your information, please contact your ALS coordinator directly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Announcements Board */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
                <MegaphoneIcon className="w-6 h-6 text-[#0038A8]" />
                <h3 className="text-xl font-black text-gray-900 font-display">Announcements</h3>
              </div>

              <div className="space-y-6">
                {announcements.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10 font-medium italic">No announcements at this time.</p>
                ) : (
                  announcements.map((item: any) => (
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
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-200 text-gray-600">
                           Announcement
                         </span>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           {new Date(item.date || item.created_at || new Date()).toLocaleDateString()}
                         </span>
                      </div>
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
