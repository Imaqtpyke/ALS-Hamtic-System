import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// Types
export type Student = {
  id: string;
  name: string;
  email: string;
  contactInfo?: string;
  role?: 'student' | 'admin';
  enrollmentDate: string;
  subjects: number;
  status: string;
  progress: number;
  is_resubmission?: boolean;
  enrolledSubjects?: string[];
  profileUrl?: string;
  certificates?: string[];
  fullData?: any; // New field for detailed modal
};

export type Subject = {
  id: string; // BIGINT from Supabase
  name: string;
  students: number;
  capacity: number;
  schedule: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: string;
};


export type UserProfile = {
  id: string;
  email: string;
  role: 'admin' | 'student';
  is_blocked: boolean;
  block_reason?: string;
  created_at: string;
};


interface DataContextType {
  students: Student[];
  subjects: Subject[];
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  
  // User Management
  profiles: UserProfile[];
  sendAdminMessage: (enrollmentId: string, userId: string, message: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [enrollRes, subRes, annRes, profRes] = await Promise.all([
        supabase.from('enrollments').select('*').order('submitted_at', { ascending: false }),
        supabase.from('subjects').select('*'),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        (async () => {
          try {
            // Updated: Only fetch all user profiles from Firestore if current user is an Admin
            if (user?.role?.role !== 'admin') {
              return { data: [], error: null };
            }

            const querySnapshot = await getDocs(collection(db, 'users'));
            return {
              data: querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as UserProfile[],
              error: null
            };
          } catch (e) {
            // Keep error logging minimal for non-critical failures
            console.warn('User Profile syncing deferred or restricted:', e);
            return { data: [], error: null };
          }
        })()
      ]);

      if (enrollRes.error) throw enrollRes.error;
      if (subRes.error) throw subRes.error;
      if (annRes.error) throw annRes.error;

      // Map enrollments to Student type with defensive coding
      const mappedStudents: Student[] = (enrollRes.data || []).map((e: any) => {
        const info = e.personal_info || {};
        return {
          id: e.id,
          name: info.firstName ? `${info.firstName} ${info.lastName || ''}`.trim() : 'Unnamed Learner',
          email: info.email || 'No Email',
          contactInfo: info.phone || 'No Contact',
          enrollmentDate: e.submitted_at,
          subjects: e.subjects?.length || 0,
          status: e.status || 'pending',
          progress: e.status === 'graduated' ? 100 : (e.status === 'enrolled' ? 60 : 10),
          is_resubmission: e.is_resubmission || false,
          enrolledSubjects: e.subjects?.map((s: any) => s.name) || [],
          role: 'student',
          fullData: e // Store original payload
        };
      });

      // Map Supabase items to local types
      setStudents(mappedStudents);
      setSubjects(subRes.data as Subject[] || []);
      setAnnouncements((annRes.data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        date: a.created_at,
        priority: a.priority
      })));
      
      
      // Synthesize profiles to ensure the "Manage Users" section is never empty
      // Merge Firestore data (if available) with local registry data
      const baseProfiles = profRes.data as UserProfile[] || [];
      const profileMap = new Map<string, UserProfile>();
      
      // 1. Add Firestore profiles (source of truth for metadata)
      baseProfiles.forEach(p => profileMap.set(p.id, p));

      // 2. Ensure current Admin is in the list (Active Session)
      if (user?.uid && !profileMap.has(user.uid)) {
        profileMap.set(user.uid, {
          id: user.uid,
          email: user.email || 'Admin',
          role: 'admin',
          is_blocked: false,
          created_at: new Date().toISOString()
        });
      }
      
      // 3. Ensure each enrolled student has a profile entry (Supabase Registry)
      mappedStudents.forEach(s => {
        const uid = s.fullData?.user_id;
        if (uid && !profileMap.has(uid)) {
          profileMap.set(uid, {
            id: uid,
            email: s.email,
            role: 'student',
            // Synchronize block status from both Firestore (is_blocked) and Supabase (status === 'blocked')
            is_blocked: s.status === 'blocked',
            created_at: s.enrollmentDate || new Date().toISOString()
          });
        }
      });

      setProfiles(Array.from(profileMap.values()));
      
    } catch (err: any) {
      console.error('Data Fetch Error:', err);
      setError(err.message);
      toast.error('Sync failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.uid, user?.role?.role]); // Re-fetch when user logs in or role is changed

  // Real-time Subscription for Data Synchronicity
  useEffect(() => {
    if (isSupabaseConfigured) {
      const dataChannel = supabase
        .channel('global-data-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.priority === 'high') {
            toast.success(`HIGH PRIORITY: ${payload.new.title}`, { duration: 6000 });
          }
          fetchAllData();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' }, () => {
          toast.success("New student enrollment submitted!");
          fetchAllData();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enrollments' }, () => {
          fetchAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchAllData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(dataChannel);
      };
    }
  }, []);

  // CRUD Operations
  const addStudent = async (_student: Omit<Student, 'id'>) => {
    // This would typically involve an enrollment submission
    toast.error('Direct student addition not permitted');
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    // Map only the Supabase-safe column names from the Student type.
    // Sending unknown keys (like `name`, `progress`, `subjects`) causes a 400 error.
    // The enrollments table also has a CHECK constraint: status='approved' requires approved_at,
    // and status='rejected' requires rejected_at — so we must include those timestamps.
    const supabaseUpdate: Record<string, any> = {};
    if (updates.status !== undefined) {
      supabaseUpdate.status = updates.status;
      if (updates.status === 'enrolled' || updates.status === 'approved') {
        supabaseUpdate.approved_at = new Date().toISOString();
      }
      if (updates.status === 'rejected') {
        supabaseUpdate.rejected_at = new Date().toISOString();
      }
    }
    if (updates.enrolledSubjects !== undefined) supabaseUpdate.subjects = updates.enrolledSubjects;

    if (Object.keys(supabaseUpdate).length === 0) {
      console.warn('[DataContext] updateStudent called with no Supabase-mappable fields:', updates);
      return;
    }

    const { error } = await supabase.from('enrollments').update(supabaseUpdate).eq('id', id);
    if (error) throw error;
    
    
    fetchAllData();
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) throw error;
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const sendAdminMessage = async (enrollmentId: string, userId: string, message: string) => {
    const { error } = await supabase
      .from('admin_messages')
      .insert([{
        enrollment_id: enrollmentId,
        user_id: userId,
        message: message,
        is_read: false
      }]);

    if (error) {
      console.error('Error sending admin message:', error);
      throw error;
    }
    
    // Refresh to ensure any local state dependent on messages is updated if necessary
    // (though students usually see this, not admins)
    await fetchAllData();
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    const { error } = await supabase.from('subjects').insert(subject);
    if (error) throw error;
    fetchAllData();
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const { error } = await supabase.from('subjects').update(updates).eq('id', id);
    if (error) throw error;
    fetchAllData();
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
    fetchAllData();
  };

  const addAnnouncement = async (ann: Omit<Announcement, 'id' | 'date'>) => {
    const { error } = await supabase.from('announcements').insert(ann);
    if (error) throw error;
    fetchAllData();
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const { error } = await supabase.from('announcements').update(updates).eq('id', id);
    if (error) throw error;
    fetchAllData();
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    fetchAllData();
  };

  // `[x]` Update `Student` type and mapping in `src/DataContext.tsx` to include `fullData`

  return (
    <DataContext.Provider value={{
      students,
      subjects,
      announcements,
      loading,
      error,
      refreshData: fetchAllData,
      addStudent,
      updateStudent,
      deleteStudent,
      sendAdminMessage,
      addSubject,
      updateSubject,
      deleteSubject,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      // User Management
      profiles,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataContext must be used within a DataProvider');
  return context;
};