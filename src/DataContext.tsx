import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { toast } from 'react-hot-toast';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [enrollRes, subRes, annRes] = await Promise.all([
        supabase.from('enrollments').select('*').order('submitted_at', { ascending: false }),
        supabase.from('subjects').select('*'),
        supabase.from('announcements').select('*').order('created_at', { ascending: false })
      ]);

      if (enrollRes.error) throw enrollRes.error;
      if (subRes.error) throw subRes.error;
      if (annRes.error) throw annRes.error;

      // Map enrollments to Student type with defensive coding
      const mappedStudents: Student[] = (enrollRes.data || []).map(e => {
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
          role: 'student'
        };
      });

      // Map Supabase items to local types
      setStudents(mappedStudents);
      setSubjects(subRes.data as Subject[] || []);
      setAnnouncements((annRes.data || []).map(a => ({
        id: a.id,
        title: a.title,
        message: a.message,
        date: a.created_at,
        priority: a.priority
      })));
      
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

    // Real-time Subscription for Data Synchronicity
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
    const { error } = await supabase.from('enrollments').update(updates).eq('id', id);
    if (error) throw error;
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
    fetchAllData();
  };

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
      addAnnouncement
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