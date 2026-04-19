import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, AlertTriangleIcon, HelpCircleIcon } from 'lucide-react';
import { submitEnrollment } from '../services/enrollmentService';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { InputField, SelectField, TextareaField } from '../components/forms/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

type Subject = { id: number; name: string };
type FormData = {
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName: string;
    birthdate: string;
    gender: string;
    // Composed full address kept for backend compatibility
    address: string;
    // Detailed address fields
    addressStreet: string;
    addressBarangay: string;
    addressCity: string;
    addressProvince: string;
    addressZip: string;
    email: string;
    phone: string;
    lrn: string;
  };
  educationalBackground: {
    lastGradeLevel: string;
    lastSchoolAttended: string;
    yearLastAttended: string;
    reason: string;
  };
  learningPreferences: {
    learningStyle: string;
    preferredSchedule: string;
    accommodation: string;
  };
  subjects: Subject[];
};

// Add type for enrollment result
type EnrollmentResult = {
  success: boolean;
  error?: string | { message: string; details?: string };
  data?: any;
};

const ConfirmModal = ({ 
  title, 
  description, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Back",
  variant = "primary"
}: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-sans">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg border border-gray-100 flex flex-col"
    >
      <h2 className="text-2xl font-black mb-2 font-display uppercase tracking-tight text-gray-900">{title}</h2>
      <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">{description}</p>
      
      <div className="flex justify-end gap-6 pt-8 border-t border-gray-50">
        <button 
          className="text-sm font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest" 
          onClick={onCancel}
        >
          {cancelText}
        </button>
        <button 
          className={`px-10 py-4 font-black rounded-3xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest ${
            variant === 'danger' 
              ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700' 
              : 'bg-[#0038A8] text-white shadow-blue-600/20 hover:bg-blue-800'
          }`}
          onClick={() => {
            onConfirm();
            onCancel();
          }}
        >
          {confirmText}
        </button>
      </div>
    </motion.div>
  </div>
);

const Enrollment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingEnrollmentId, setExistingEnrollmentId] = useState<string | null>(null);
  const ENABLE_DRAFT = false;
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      middleName: '',
      birthdate: '',
      gender: '',
      address: '',
      addressStreet: '',
      addressBarangay: '',
      addressCity: '',
      addressProvince: '',
      addressZip: '',
      email: '',
      phone: '',
      lrn: '' // Learner Reference Number
    },
    educationalBackground: {
      lastGradeLevel: 'Junior High - Grade 7 - 10',
      lastSchoolAttended: '',
      yearLastAttended: '',
      reason: ''
    },
    learningPreferences: {
      learningStyle: 'Reading/Writing',
      preferredSchedule: '',
      accommodation: ''
    },
    subjects: []
  });
  const totalSteps = 5;
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [submissionError, setSubmissionError] = useState<{ message: string; details?: string } | null>(null);
  const STORAGE_KEY = 'als_enrollment_draft_v1';
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'danger' | 'primary';
  } | null>(null);

  const commonAccommodations = [
    "None",
    "Visual Impairment Support",
    "Hearing Impairment Support",
    "Mobility Assistance",
    "Learning Disability Support",
    "Medical/Health Accommodations"
  ];
  
  const [showOtherAccommodation, setShowOtherAccommodation] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    if (!ENABLE_DRAFT) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData(prev => ({ ...prev, ...parsed }));
          
          if (parsed.learningPreferences?.accommodation) {
             if (!commonAccommodations.includes(parsed.learningPreferences.accommodation) && parsed.learningPreferences.accommodation !== 'None') {
                setShowOtherAccommodation(true);
             }
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Fetch available subjects from Supabase (fallback to defaults if not found)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .order('id', { ascending: true });
        if (error) throw error;
        const active = (data || [])
          .map((s: any) => ({ id: Number(s.id), name: s.name as string }));
        setAvailableSubjects(active);
      } catch {
        setAvailableSubjects([]);
      }
    };
    loadSubjects();
  }, []);

  // Pre-fill if there's a pending enrollment and mark messages as read
  useEffect(() => {
    if (!user) return;

    const checkExisting = async () => {
      try {
        const { data } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.uid)
          .eq('status', 'pending')
          .maybeSingle();
        
        if (data) {
          setExistingEnrollmentId(data.id);
          
          // Pre-fill form data
          setFormData({
            personalInfo: {
              ...data.personal_info,
              addressStreet: data.personal_info.addressStreet || '',
              addressBarangay: data.personal_info.addressBarangay || '',
              addressCity: data.personal_info.addressCity || '',
              addressProvince: data.personal_info.addressProvince || '',
              addressZip: data.personal_info.addressZip || '',
              lrn: data.personal_info.lrn || '',
              address: data.personal_info.address || ''
            },
            educationalBackground: data.educational_background,
            learningPreferences: data.learning_preferences,
            subjects: data.subjects || []
          });

          // Mark messages as read
          await supabase
            .from('admin_messages')
            .update({ is_read: true })
            .eq('user_id', user.uid)
            .eq('is_read', false);
        }
      } catch (err) {
        console.error('Error checking existing enrollment:', err);
      }
    };

    checkExisting();
  }, [user]);

  // Auto-save draft when formData changes (debounced)
  useEffect(() => {
    if (!ENABLE_DRAFT) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        // ignore quota errors
      }
    }, 300);
    return () => clearTimeout(id);
  }, [formData]);

  const clearCurrentStep = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }

    setErrors({});
    setTouched({});
    setSubmissionError(null);

    setFormData(prev => {
      if (currentStep === 1) {
        return {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            firstName: '',
            lastName: '',
            middleName: '',
            birthdate: '',
            gender: '',
            address: '',
            addressStreet: '',
            addressBarangay: '',
            addressCity: '',
            addressProvince: '',
            addressZip: '',
            email: '',
            phone: '',
            lrn: ''
          }
        };
      }

      if (currentStep === 2) {
        return {
          ...prev,
          educationalBackground: {
            ...prev.educationalBackground,
            lastGradeLevel: '',
            lastSchoolAttended: '',
            yearLastAttended: '',
            reason: ''
          }
        };
      }

      if (currentStep === 3) {
        return {
          ...prev,
          learningPreferences: {
            ...prev.learningPreferences,
            learningStyle: '',
            preferredSchedule: '',
            accommodation: ''
          }
        };
      }

      if (currentStep === 4) {
        return {
          ...prev,
          subjects: []
        };
      }

      if (currentStep === 5) {
        return {
          personalInfo: {
            firstName: '',
            lastName: '',
            middleName: '',
            birthdate: '',
            gender: '',
            address: '',
            addressStreet: '',
            addressBarangay: '',
            addressCity: '',
            addressProvince: '',
            addressZip: '',
            email: '',
            phone: '',
            lrn: ''
          },
          educationalBackground: {
            lastGradeLevel: 'Junior High - Grade 7 - 10',
            lastSchoolAttended: '',
            yearLastAttended: '',
            reason: ''
          },
          learningPreferences: {
            learningStyle: 'Reading/Writing',
            preferredSchedule: '',
            accommodation: ''
          },
          subjects: []
        };
      }

      return prev;
    });

    window.scrollTo(0, 0);
  };

  const validateField = (section: keyof FormData, field: string, value: string) => {
    if (section === 'personalInfo') {
      if (field === 'firstName' && !value.trim()) return 'First name is required.';
      if (field === 'lastName' && !value.trim()) return 'Last name is required.';
      if (field === 'birthdate' && !value.trim()) return 'Birthdate is required.';
      if (field === 'gender' && !value.trim()) return 'Gender is required.';
      if (field === 'addressStreet' && !value.trim()) return 'Street is required.';
      if (field === 'addressBarangay' && !value.trim()) return 'Barangay is required.';
      if (field === 'addressCity' && !value.trim()) return 'City/Municipality is required.';
      if (field === 'addressProvince' && !value.trim()) return 'Province is required.';
      if (field === 'addressZip') {
        if (!value.trim()) return 'ZIP code is required.';
        if (!/^\d{4}$/.test(value.trim())) return 'ZIP code must be 4 digits.';
      }
      if (field === 'email') {
        if (!value.trim()) return 'Email is required.';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Invalid email address.';
      }
      if (field === 'phone') {
        if (!value.trim()) return 'Phone number is required.';
        if (!/^\+?\d{7,15}$/.test(value.replace(/[-\s]/g, ''))) return 'Invalid phone number.';
      }
    }
    return '';
  };

  const handleChange = (section: keyof FormData, field: string, value: string) => {
    setFormData(prev => {
      const updated: any = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      // Auto-compose full address when any detailed address field changes
      if (
        section === 'personalInfo' &&
        ['addressStreet', 'addressBarangay', 'addressCity', 'addressProvince', 'addressZip'].includes(field)
      ) {
        const pi = updated.personalInfo as typeof prev.personalInfo;
        const parts = [
          pi.addressStreet?.trim(),
          pi.addressBarangay?.trim() ? `Brgy. ${pi.addressBarangay.trim()}` : '',
          pi.addressCity?.trim(),
          pi.addressProvince?.trim(),
          pi.addressZip?.trim()
        ].filter(Boolean);
        updated.personalInfo.address = parts.join(', ');
      }
      return updated;
    });
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(section, field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Subject selection is view-only; no toggle handler needed

  const validateCurrentStep = () => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};
    const newTouched: { [key: string]: boolean } = {};

    if (currentStep === 1) {
      const fields = [
        'firstName', 'lastName', 'birthdate', 'gender',
        'addressStreet', 'addressBarangay', 'addressCity', 'addressProvince', 'addressZip',
        'email', 'phone'
      ];
      fields.forEach(field => {
        const val = String(formData.personalInfo[field as keyof typeof formData.personalInfo] || '');
        const err = validateField('personalInfo', field, val);
        if (err) {
          isValid = false;
          newErrors[field] = err;
          newTouched[field] = true;
        }
      });
    }

    if (currentStep === 2) {
      const fields = ['lastSchoolAttended', 'yearLastAttended'];
      fields.forEach(field => {
        const val = String(formData.educationalBackground[field as keyof typeof formData.educationalBackground] || '');
        if (!val.trim()) {
          isValid = false;
          newErrors[field] = 'This field is required.';
          newTouched[field] = true;
        }
      });
    }

    if (currentStep === 3) {
      const schedule = formData.learningPreferences.preferredSchedule;
      if (!schedule || !schedule.trim()) {
        isValid = false;
        newErrors['preferredSchedule'] = 'Please select a preferred schedule.';
        newTouched['preferredSchedule'] = true;
      }
    }

    if (currentStep === 4) {
      // Step 4 is view-only for subjects now! Wait, subjects selection was moved to backend/view-only?
      // "Available Subjects (View-only)". The user doesn't pick them?
      // Let's check Step 4 UI again: it maps availableSubjects and displays them...
      // There's no input. Actually, the prompt says "Review your information...".
      // Let's assume Step 4 is valid always.
    }

    if (!isValid) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      setTouched(prev => ({ ...prev, ...newTouched }));
      // Error toast for general notification
      toast.error('Please fill in all required fields correctly.');
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const processSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    if (!user || !user.uid) {
      setSubmissionError({
        message: 'Authentication error',
        details: 'User ID not found. Please log in again.'
      });
      setIsSubmitting(false);
      window.scrollTo(0, 0);
      return;
    }

    try {
      const result = await submitEnrollment({
        personalInfo: formData.personalInfo,
        educationalBackground: formData.educationalBackground,
        learningPreferences: formData.learningPreferences,
        subjects: formData.subjects,
        existingId: existingEnrollmentId || undefined
      }) as EnrollmentResult;

      if (result.success) {
        setIsSubmitted(true);
      } else {
        console.error('Failed to submit enrollment:', result.error);
        setSubmissionError({
          message: typeof result.error === 'string' ? result.error : 'Failed to submit enrollment',
          details: typeof result.error === 'object' && result.error?.details ? result.error.details : undefined
        });
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      console.error('Error submitting enrollment:', error);
      setSubmissionError({
        message: 'An error occurred while submitting your application.',
        details: error.message || 'Please try again later.'
      });
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModal({
      title: 'Final Confirmation',
      description: 'Are you sure all the information you provided is correct? You will not be able to edit your application once it is submitted for review.',
      confirmText: 'Submit Now',
      cancelText: 'Check Again',
      onConfirm: processSubmit
    });
  };
  // availableSubjects now loaded from Supabase or defaults via state above
  if (isSubmitted) {
    return <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold heading-gradient">
              Application Submitted Successfully!
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Thank you for enrolling in the Alternative Learning System.
            </p>
            <p className="mt-2 text-gray-600">
              Your application has been received and is pending review by our admin team. They will contact you with the result and next steps via the email address or phone number you provided.
            </p>
            <div className="mt-8 border-t border-gray-200 pt-8">
              <p className="text-gray-600 font-medium">Application Summary:</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base text-gray-900">
                    {formData.personalInfo.firstName}{' '}
                    {formData.personalInfo.middleName}{' '}
                    {formData.personalInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base text-gray-900">
                    {formData.personalInfo.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Preferred Schedule
                  </p>
                  <p className="text-base text-gray-900">
                    {formData.learningPreferences.preferredSchedule === 'weekday_morning' && 'Weekday Mornings (8AM - 12PM)'}
                    {formData.learningPreferences.preferredSchedule === 'weekday_afternoon' && 'Weekday Afternoons (1PM - 5PM)'}
                    {formData.learningPreferences.preferredSchedule === 'weekday_evening' && 'Weekday Evenings (6PM - 9PM)'}
                    {formData.learningPreferences.preferredSchedule === 'weekend_morning' && 'Weekend Mornings (8AM - 12PM)'}
                    {formData.learningPreferences.preferredSchedule === 'weekend_afternoon' && 'Weekend Afternoons (1PM - 5PM)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Subjects Selected
                  </p>
                  <p className="text-base text-gray-900">
                    {formData.subjects.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/')} className="btn-secondary">
                Return to Home
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-primary"
              >
                Go to My Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>;
  }
  return <div className="min-h-screen py-6 md:py-8 relative">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 bg-[#F9F9F9]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
          <span className="text-[#0038A8] font-bold tracking-widest uppercase text-xs">
            Student Intake
          </span>
          <h1 className="text-4xl font-black text-gray-900 mt-3 font-display">
            ALS Enrollment Application
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl">
            Empowering your educational journey. Please complete the following 
            steps to formalize your enrollment in the Hamtic ALS program.
          </p>
        </div>
        {/* Progress Tracker */}
        <div className="mb-12" aria-label="Enrollment progress" role="region" aria-live="polite">
          {/* Mobile Step Description */}
          <div className="sm:hidden mb-4 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0038A8] mb-1">Step {currentStep} of {totalSteps}</p>
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">
                {currentStep === 1 && 'Personal Information'}
                {currentStep === 2 && 'Educational History'}
                {currentStep === 3 && 'Learning Preferences'}
                {currentStep === 4 && 'Subject Selection'}
                {currentStep === 5 && 'Final Review'}
             </h3>
          </div>

          <div className="flex items-center justify-between w-full mb-6 gap-2">
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className="flex flex-col items-center flex-1" aria-current={currentStep === step ? 'step' : undefined}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-sm ${currentStep >= step ? 'bg-[#0038A8] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {currentStep > step ? <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <span className="text-xs sm:text-sm font-bold">{step}</span>}
                </div>
                <div className={`text-[10px] uppercase tracking-wider mt-3 text-center hidden sm:block font-extrabold ${currentStep === step ? 'text-[#0038A8]' : 'text-gray-500'}`}>
                  {step === 1 && 'Personal Info'}
                  {step === 2 && 'Educational'}
                  {step === 3 && 'Preferences'}
                  {step === 4 && 'Subjects'}
                  {step === 5 && 'Review'}
                </div>
              </div>
            ))}
          </div>
          <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-[#0038A8] rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message Banner */}
        {submissionError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {submissionError.message}
                </h3>
                {submissionError.details && (
                  <p className="mt-1 text-sm text-red-700">
                    {submissionError.details}
                  </p>
                )}
                <div className="mt-2">
                  <button
                    type="button"
                    className="text-sm font-medium text-red-800 hover:text-red-600"
                    onClick={() => setSubmissionError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="card-tonal p-4 sm:p-10 md:p-12 overflow-hidden min-h-[400px]">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    id="firstName"
                    label="First Name"
                    required
                    value={formData.personalInfo.firstName}
                    onChange={e => handleChange('personalInfo', 'firstName', (e.target as HTMLInputElement).value)}
                    error={touched.firstName ? errors.firstName : ''}
                  />
                  <InputField
                    id="middleName"
                    label="Middle Name"
                    value={formData.personalInfo.middleName}
                    onChange={e => handleChange('personalInfo', 'middleName', (e.target as HTMLInputElement).value)}
                    error={touched.middleName ? errors.middleName : ''}
                  />
                  <InputField
                    id="lastName"
                    label="Last Name"
                    required
                    value={formData.personalInfo.lastName}
                    onChange={e => handleChange('personalInfo', 'lastName', (e.target as HTMLInputElement).value)}
                    error={touched.lastName ? errors.lastName : ''}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    id="birthdate"
                    label="Birthdate"
                    type="date"
                    required
                    value={formData.personalInfo.birthdate}
                    onChange={e => handleChange('personalInfo', 'birthdate', (e.target as HTMLInputElement).value)}
                    error={touched.birthdate ? errors.birthdate : ''}
                  />
                  <SelectField
                    id="gender"
                    label="Gender"
                    required
                    value={formData.personalInfo.gender}
                    onChange={e => handleChange('personalInfo', 'gender', (e.target as HTMLSelectElement).value)}
                    error={touched.gender ? errors.gender : ''}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </SelectField>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Complete Address</label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      id="addressStreet"
                      label="Street / House No. / Purok"
                      required
                      value={formData.personalInfo.addressStreet}
                      onChange={e => handleChange('personalInfo', 'addressStreet', (e.target as HTMLInputElement).value)}
                      error={touched.addressStreet ? errors.addressStreet : ''}
                    />
                    <InputField
                      id="addressBarangay"
                      label="Barangay"
                      required
                      value={formData.personalInfo.addressBarangay}
                      onChange={e => handleChange('personalInfo', 'addressBarangay', (e.target as HTMLInputElement).value)}
                      error={touched.addressBarangay ? errors.addressBarangay : ''}
                    />
                    <InputField
                      id="addressCity"
                      label="City / Municipality"
                      required
                      value={formData.personalInfo.addressCity}
                      onChange={e => handleChange('personalInfo', 'addressCity', (e.target as HTMLInputElement).value)}
                      error={touched.addressCity ? errors.addressCity : ''}
                    />
                    <InputField
                      id="addressProvince"
                      label="Province"
                      required
                      value={formData.personalInfo.addressProvince}
                      onChange={e => handleChange('personalInfo', 'addressProvince', (e.target as HTMLInputElement).value)}
                      error={touched.addressProvince ? errors.addressProvince : ''}
                    />
                    <InputField
                      id="addressZip"
                      label="ZIP Code"
                      required
                      value={formData.personalInfo.addressZip}
                      onChange={e => handleChange('personalInfo', 'addressZip', (e.target as HTMLInputElement).value)}
                      error={touched.addressZip ? errors.addressZip : ''}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Address preview: <span className="font-medium text-gray-800">{formData.personalInfo.address || '—'}</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    id="email"
                    label="Email Address"
                    type="email"
                    required
                    value={formData.personalInfo.email}
                    onChange={e => handleChange('personalInfo', 'email', (e.target as HTMLInputElement).value)}
                    error={touched.email ? errors.email : ''}
                  />
                  <InputField
                    id="phone"
                    label="Phone Number"
                    type="tel"
                    required
                    value={formData.personalInfo.phone}
                    onChange={e => handleChange('personalInfo', 'phone', (e.target as HTMLInputElement).value)}
                    error={touched.phone ? errors.phone : ''}
                  />
                </div>
                <InputField
                  id="lrn"
                  label="Learner Reference Number (LRN)"
                  hint="if available"
                  value={formData.personalInfo.lrn}
                  onChange={e => handleChange('personalInfo', 'lrn', (e.target as HTMLInputElement).value)}
                  error={touched.lrn ? errors.lrn : ''}
                />
              </div>}
            {/* Step 2: Educational Background */}
            {currentStep === 2 && <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Educational Background
                </h2>
                <div>
                  <label htmlFor="lastGradeLevel" className="block text-sm font-medium text-gray-700">
                    Last Grade Level Completed
                  </label>
                  <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    Junior High - Grade 7 - 10
                  </div>
                </div>
                <div>
                  <label htmlFor="lastSchoolAttended" className="block text-sm font-medium text-gray-700">
                    Last School Attended
                  </label>
                  <input type="text" id="lastSchoolAttended" value={formData.educationalBackground.lastSchoolAttended} onChange={e => handleChange('educationalBackground', 'lastSchoolAttended', e.target.value)} className={`mt-1 block w-full border ${errors.lastSchoolAttended && touched.lastSchoolAttended ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} />
                  {errors.lastSchoolAttended && touched.lastSchoolAttended && <p className="text-red-500 text-xs mt-1">{errors.lastSchoolAttended}</p>}
                </div>
                <div>
                  <label htmlFor="yearLastAttended" className="block text-sm font-medium text-gray-700">
                    Year Last Attended
                  </label>
                  <input type="number" id="yearLastAttended" min="1950" max={new Date().getFullYear()} value={formData.educationalBackground.yearLastAttended} onChange={e => handleChange('educationalBackground', 'yearLastAttended', e.target.value)} className={`mt-1 block w-full border ${errors.yearLastAttended && touched.yearLastAttended ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} />
                  {errors.yearLastAttended && touched.yearLastAttended && <p className="text-red-500 text-xs mt-1">{errors.yearLastAttended}</p>}
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason for Stopping/Not Continuing Formal Education (optional)
                  </label>
                  <textarea id="reason" value={formData.educationalBackground.reason} onChange={e => handleChange('educationalBackground', 'reason', e.target.value)} rows={3} className={`mt-1 block w-full border ${errors.reason && touched.reason ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} />
                  {errors.reason && touched.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                </div>
              </div>}
            {/* Step 3: Learning Preferences */}
            {currentStep === 3 && <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Learning Preferences
                </h2>
                <div>
                  <label htmlFor="learningStyle" className="block text-sm font-medium text-gray-700">
                    Preferred Learning Style
                  </label>
                  <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    Reading/Writing
                  </div>
                </div>
                <SelectField
                  id="preferredSchedule"
                  label="Preferred Schedule"
                  required
                  value={formData.learningPreferences.preferredSchedule}
                  onChange={e => handleChange('learningPreferences', 'preferredSchedule', (e.target as HTMLSelectElement).value)}
                  error={touched.preferredSchedule ? errors.preferredSchedule : ''}
                >
                  <option value="">Select Schedule</option>
                  <option value="monday_hamtic">Monday - Hamtic Central School CLC (7:00 AM - 4:30 PM)</option>
                  <option value="tuesday_hamtic">Tuesday - Hamtic Central School CLC (7:30 AM - 4:30 PM)</option>
                  <option value="wednesday_bongbongan">Wednesday - Bongbongan II Elementary School CLC (7:30 AM - 4:30 PM)</option>
                  <option value="thursday_hamtic">Thursday - Hamtic Central School CLC (7:30 AM - 4:30 PM)</option>
                  <option value="friday_lapaz">Friday - Lapaz Elementary School CLC (7:30 AM - 4:30 PM)</option>
                </SelectField>
                <SelectField
                  id="accommodationSelect"
                  label="Special Accommodations"
                  hint="if any"
                  value={showOtherAccommodation ? 'Other' : (commonAccommodations.includes(formData.learningPreferences.accommodation) ? formData.learningPreferences.accommodation : (formData.learningPreferences.accommodation ? 'Other' : 'None'))}
                  onChange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    if (val === 'Other') {
                      setShowOtherAccommodation(true);
                      if (commonAccommodations.includes(formData.learningPreferences.accommodation) || formData.learningPreferences.accommodation === 'None') {
                        handleChange('learningPreferences', 'accommodation', '');
                      }
                    } else {
                      setShowOtherAccommodation(false);
                      handleChange('learningPreferences', 'accommodation', val === 'None' ? '' : val);
                    }
                  }}
                  error=""
                >
                  <option value="None">None</option>
                  {commonAccommodations.filter(opt => opt !== "None").map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="Other">Other</option>
                </SelectField>

                <AnimatePresence>
                  {showOtherAccommodation && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <TextareaField
                        id="accommodation"
                        label="Please Specify"
                        rows={3}
                        placeholder="Please describe any special accommodations you may need (e.g., visual aids, hearing assistance, etc.)"
                        value={formData.learningPreferences.accommodation}
                        onChange={e => handleChange('learningPreferences', 'accommodation', (e.target as HTMLTextAreaElement).value)}
                        error={touched.accommodation ? errors.accommodation : ''}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <HelpCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Your learning preferences help us tailor the educational
                        experience to your needs. You can always update these
                        preferences later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>}
            {/* Step 4: Available Subjects (View-only) */}
            {currentStep === 4 && <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Available Subjects</h2>
                <p className="text-gray-600">
                  Below are the ALS learning subjects available this semester (view-only).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableSubjects.map(subject => (
                    <div key={subject.id} className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 hover:bg-blue-50 transition-colors">
                      <h3 className="font-medium text-gray-900">{subject.name}</h3>
                    </div>
                  ))}
                  {availableSubjects.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Subjects will appear here when available.
                    </div>
                  )}
                </div>
              </div>}
            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
                <p className="text-gray-600">Review your information, then click Submit to finalize your application.</p>
              </div>
            )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-12 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button type="button" onClick={handlePrevious} className={`px-6 py-3 rounded-lg text-sm font-bold text-gray-600 hover:text-[#0038A8] transition-colors ${currentStep === 1 ? 'invisible' : ''}`}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      title: 'Cancel Enrollment',
                      description: 'Are you sure you want to cancel your application? Any unsaved progress will be permanently lost.',
                      confirmText: 'Yes, Cancel',
                      cancelText: 'Stay Here',
                      variant: 'danger',
                      onConfirm: () => { window.location.href = '/'; }
                    });
                  }}
                  className="px-6 py-3 rounded-lg text-sm font-bold text-red-400 hover:text-red-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={clearCurrentStep}
                  className="px-6 py-3 rounded-lg text-sm font-bold text-gray-400 hover:text-gray-500 transition-colors"
                  disabled={isSubmitting}
                >
                  Reset Step
                </button>
              </div>
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  Continue to Step {currentStep + 1}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-cta text-blue-900 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Finalizing...' : 'Submit Final Application'}
                </button>
              )}
            </div>
          </form>
        </div>
        {/* Help Section */}
        <div className="mt-8 bg-white rounded-xl border border-blue-100 shadow-md p-4 sm:p-6 relative overflow-hidden">
          {/* Decorative corner shape */}
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-red-100 rotate-12 rounded-lg" />
          <div className="flex items-center">
            <HelpCircleIcon className="h-6 w-6 text-blue-500" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">
              Need Help?
            </h3>
          </div>
          <p className="mt-2 text-gray-600">
            If you have questions about the enrollment process or need
            assistance, please contact our support team:
          </p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li className="flex items-center">
              <span className="w-20 font-medium">Phone:</span>
              <span>(+63) 123-456-7890</span>
            </li>
            <li className="flex items-center">
              <span className="w-20 font-medium">Email:</span>
              <span>support.als@deped-hamtic.gov.ph</span>
            </li>
            <li className="flex items-center">
              <span className="w-20 font-medium">Hours:</span>
              <span>Monday to Friday, 8:00 AM to 5:00 PM</span>
            </li>
          </ul>
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal 
          {...confirmModal} 
          onCancel={() => setConfirmModal(null)} 
        />
      )}
    </div>;
};
export default Enrollment;
