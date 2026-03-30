import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  id: string;
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
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addSubject: (subject: Subject) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API = 'http://localhost:3001';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Provide empty arrays for all data
  const [students] = useState<Student[]>([]);
  const [subjects] = useState<Subject[]>([]);
  const [announcements] = useState<Announcement[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // All CRUD operations are no-ops
  const addStudent = async (_student: Student) => {};
  const updateStudent = async (_student: Student) => {};
  const deleteStudent = async (_id: string) => {};
  const addSubject = async (_subject: Subject) => {};
  const updateSubject = async (_subject: Subject) => {};
  const deleteSubject = async (_id: string) => {};
  const addAnnouncement = async (_announcement: Announcement) => {};

  return (
    <DataContext.Provider value={{
      students,
      subjects,
      announcements,
      loading,
      error,
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