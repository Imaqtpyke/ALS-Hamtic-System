import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { logAuditAction } from './utils/auditLogger';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

export type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
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
  blockUser: (id: string, reason: string) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUserAccount: (id: string) => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [enrollRes, subRes, annRes, profRes, logRes] = await Promise.all([
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
        })(),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (enrollRes.error) throw enrollRes.error;
      if (subRes.error) throw subRes.error;
      if (annRes.error) throw annRes.error;
      if (logRes.error && (logRes.error as any).code !== 'PGRST205') throw logRes.error;

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
      setAuditLogs(logRes.data as AuditLog[] || []);
      
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
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
    
    if (user?.uid) {
      let action: any = 'edit_enrollment';
      if (updates.status === 'enrolled') action = 'approve_enrollment';
      if (updates.status === 'rejected') action = 'reject_enrollment';
      logAuditAction(user.uid, action, 'enrollment', id, updates);
    }
    
    fetchAllData();
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) throw error;
    fetchAllData();
  };

  const addSubject = async (sub: Omit<Subject, 'id'>) => {
    const { error } = await supabase.from('subjects').insert(sub);
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
    if (user?.uid) logAuditAction(user.uid, 'create_announcement', 'announcement', 'new', ann);
    fetchAllData();
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const { error } = await supabase.from('announcements').update(updates).eq('id', id);
    if (error) throw error;
    if (user?.uid) logAuditAction(user.uid, 'edit_announcement', 'announcement', id, updates);
    fetchAllData();
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    if (user?.uid) logAuditAction(user.uid, 'delete_announcement', 'announcement', id);
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
      addSubject,
      updateSubject,
      deleteSubject,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      // User Management
      profiles,
      blockUser: async (id, reason) => {
        let firebaseSuccess = false;
        try {
          const userRef = doc(db, 'users', id);
          await updateDoc(userRef, { is_blocked: true, block_reason: reason });
          firebaseSuccess = true;
        } catch (e) {
          console.warn('Firestore block failed, falling back to Supabase registry:', e);
        }

        // Secondary fallback to Supabase enrollment status
        const { error } = await supabase
          .from('enrollments')
          .update({ status: 'blocked', notes: `Administrative Block: ${reason}` })
          .eq('user_id', id);
        
        if (error && !firebaseSuccess) throw new Error('Failed to block user on both platforms. Please check Firebase rules or Supabase connection.');

        if (user?.uid) logAuditAction(user.uid, 'block_user', 'profile', id);
        fetchAllData();
      },
      unblockUser: async (id) => {
        let firebaseSuccess = false;
        try {
          const userRef = doc(db, 'users', id);
          await updateDoc(userRef, { is_blocked: false, block_reason: null });
          firebaseSuccess = true;
        } catch (e) {
          console.warn('Firestore unblock failed, falling back to Supabase registry:', e);
        }

        // Secondary fallback to restore status to enrolled
        const { error } = await supabase
          .from('enrollments')
          .update({ status: 'enrolled' })
          .eq('user_id', id)
          .eq('status', 'blocked');
        
        if (error && !firebaseSuccess) throw new Error('Failed to unblock user on both platforms.');

        if (user?.uid) logAuditAction(user.uid, 'unblock_user', 'profile', id);
        fetchAllData();
      },
      updateProfile: async (id, updates) => {
        try {
          const userRef = doc(db, 'users', id);
          await updateDoc(userRef, updates);
        } catch (e) {
          console.error('Firestore profile update failed:', e);
          throw new Error('You do not have permission to update account metadata directly in Firebase. Please update your Firebase Security Rules.');
        }

        if (user?.uid) logAuditAction(user.uid, 'update_user_profile', 'profile', id, updates);
        fetchAllData();
      },
      deleteUserAccount: async (id) => {
        // 1. Delete from Firestore (Account Master)
        try {
          await deleteDoc(doc(db, 'users', id));
        } catch (e) {
          console.warn('Firebase account deletion restricted by permissions. Still cleaning up Supabase data...', e);
        }
        
        // 2. Delete from Supabase registry (Enrollment)
        const { error: enrollErr } = await supabase.from('enrollments').delete().eq('user_id', id);
        if (enrollErr) throw enrollErr;
        
        if (user?.uid) logAuditAction(user.uid, 'delete_account', 'profile', id);
        fetchAllData();
      },
      // Audit Logs
      auditLogs
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