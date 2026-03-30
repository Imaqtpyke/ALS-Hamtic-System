import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, CalendarIcon, BellIcon, FileTextIcon, SettingsIcon, LogOutIcon, ChevronDownIcon, CheckCircleIcon, ClockIcon, UsersIcon, PlusCircleIcon, BarChart2Icon, GridIcon, SearchIcon, TrashIcon, EditIcon, EyeIcon } from 'lucide-react';
import { useDataContext, Student, Subject } from '../DataContext';

const CustomIcon = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
};

const AdminDashboard = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);

  const { students, subjects, announcements, loading, error, addStudent, updateStudent, deleteStudent, addSubject, updateSubject, deleteSubject } = useDataContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
        <p className="text-gray-700 mb-4 text-center">{error}</p>
        <p className="text-sm text-gray-500">Please ensure the backend server is running and accessible, then refresh the page.</p>
      </div>
    );
  }

  // Filtered students for search/filter
  const filteredStudents = (students || []).filter(student => {
    const studentName = student.name || '';
    const studentId = student.id || '';
    const studentEmail = student.email || '';
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) || studentId.toLowerCase().includes(searchTerm.toLowerCase()) || studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'active') return matchesSearch && student.status === 'Active';
    if (selectedFilter === 'inactive') return matchesSearch && student.status === 'Inactive';
    if (selectedFilter === 'graduated') return matchesSearch && student.status === 'Graduated';
    return matchesSearch;
  });

  // Handlers for student CRUD
  const handleAddStudent = () => {
    setEditStudent(null);
    setShowStudentForm(true);
  };
  const handleEditStudent = (student: Student) => {
    setEditStudent(student);
    setShowStudentForm(true);
  };
  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id);
    }
  };
  const handleStudentFormSubmit = (student: Student) => {
    if (editStudent) {
      updateStudent(student);
    } else {
      addStudent(student);
    }
    setShowStudentForm(false);
    setEditStudent(null);
  };

  // Handlers for subject CRUD
  const handleAddSubject = () => {
    setEditSubject(null);
    setShowSubjectForm(true);
  };
  const handleEditSubject = (subject: Subject) => {
    setEditSubject(subject);
    setShowSubjectForm(true);
  };
  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteSubject(id);
    }
  };
  const handleSubjectFormSubmit = (subject: Subject) => {
    if (editSubject) {
      updateSubject(subject);
    } else {
      addSubject(subject);
    }
    setShowSubjectForm(false);
    setEditSubject(null);
  };

  // Simple forms for Student and Subject (for brevity, can be improved)
  const StudentForm = ({ initial, onSubmit, onCancel }: { initial?: Student, onSubmit: (s: Student) => void, onCancel: () => void }) => {
    const [form, setForm] = useState<Student>(initial || { id: '', name: '', email: '', enrollmentDate: '', subjects: 0, status: 'Active', progress: 0 });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-lg font-bold mb-4">{initial ? 'Edit Student' : 'Add Student'}</h2>
          <input className="w-full mb-2 p-2 border rounded" placeholder="ID" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Enrollment Date" value={form.enrollmentDate} onChange={e => setForm({ ...form, enrollmentDate: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Subjects (number)" type="number" value={form.subjects} onChange={e => setForm({ ...form, subjects: Number(e.target.value) })} />
          <select className="w-full mb-2 p-2 border rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
          </select>
          <input className="w-full mb-2 p-2 border rounded" placeholder="Progress (%)" type="number" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={onCancel}>Cancel</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => onSubmit(form)}>{initial ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </div>
    );
  };
  const SubjectForm = ({ initial, onSubmit, onCancel }: { initial?: Subject, onSubmit: (s: Subject) => void, onCancel: () => void }) => {
    const [form, setForm] = useState<Subject>(initial || { id: '', name: '', students: 0, capacity: 0, schedule: '' });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-lg font-bold mb-4">{initial ? 'Edit Subject' : 'Add Subject'}</h2>
          <input className="w-full mb-2 p-2 border rounded" placeholder="ID" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Students (number)" type="number" value={form.students} onChange={e => setForm({ ...form, students: Number(e.target.value) })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Capacity" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Schedule" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={onCancel}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onSubmit(form)}>{initial ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <img className="h-8 w-auto" src="/DepED-Logo.jpg" alt="DEPED Logo" />
            <span className="text-xl font-bold text-gray-900">ALS Admin</span>
          </div>
        </div>
        <nav className="flex-1 px-4 pb-4 space-y-1">
          {[{
          id: 'dashboard',
          name: 'Dashboard',
          icon: <GridIcon className="h-5 w-5" />
        },
        {
          id: 'schedule',
          name: 'Schedule',
          icon: <CalendarIcon className="h-5 w-5" />
        }, {
          id: 'assessments',
          name: 'Assessments',
          icon: <FileTextIcon className="h-5 w-5" />
        }, {
          id: 'reports',
          name: 'Reports',
          icon: <BarChart2Icon className="h-5 w-5" />
        }, {
          id: 'settings',
          name: 'Settings',
          icon: <SettingsIcon className="h-5 w-5" />
        }].map(item => (
            <a key={item.id} href="#" onClick={() => setActiveSidebarItem(item.id)} className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${activeSidebarItem === item.id ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-100'}`}>
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center md:hidden">
                <button className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none">
                  <GridIcon className="h-6 w-6" />
                </button>
                <span className="ml-2 text-lg font-medium text-gray-900">
                  Admin Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none relative">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                </button>
                <div className="relative">
                  <button className="flex items-center space-x-2 text-sm focus:outline-none">
                    <img className="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" alt="Admin profile" />
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        Admin User
                      </div>
                      <div className="text-xs text-gray-500">Administrator</div>
                    </div>
                    <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          <div className="w-full">
            {activeSidebarItem === 'dashboard' && (
              <>
                {/* Page Header */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Admin Dashboard
                  </h1>
                  <p className="mt-1 text-gray-600">
                    Manage students, subjects, and monitor system performance
                  </p>
                </div>
                {/* Dashboard Tabs */}
                <div className="mb-8 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[{
                    id: 'overview',
                    name: 'Overview'
                  }, {
                    id: 'students',
                    name: 'Students'
                  }, {
                    id: 'subjects',
                    name: 'Subjects'
                  }, {
                    id: 'announcements',
                    name: 'Announcements'
                  }].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        {tab.name}
                      </button>)}
                  </nav>
                </div>
                {/* Overview Tab Content */}
                {activeTab === 'overview' && <div>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center">
                        <div className="bg-red-100 rounded-full p-3">
                          <UsersIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-sm font-medium text-gray-500">
                            Total Students
                          </h2>
                          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full p-3">
                          <BookOpenIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-sm font-medium text-gray-500">
                            Active Subjects
                          </h2>
                          <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-sm font-medium text-gray-500">
                            Graduates (2023)
                          </h2>
                          <p className="text-2xl font-bold text-gray-900">{students.filter(s => s.status === 'Graduated').length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 rounded-full p-3">
                          <ClockIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-sm font-medium text-gray-500">
                            Pending Enrollments
                          </h2>
                          <p className="text-2xl font-bold text-gray-900">{students.filter(s => s.status === 'Pending').length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Recent Enrollments */}
                  <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">
                        Recent Enrollments
                      </h2>
                      <Link to="/enrollment" className="text-sm font-medium text-red-600 hover:text-red-500">
                        View all
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Enrollment Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.slice(-5).reverse().map(enrollment => <tr key={enrollment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {enrollment.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {enrollment.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {enrollment.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {enrollment.enrollmentDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${enrollment.status === 'Approved' || enrollment.status === 'Active' ? 'bg-green-100 text-green-800' : enrollment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                  {enrollment.status}
                                </span>
                              </td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Quick Access */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-4">
                        <button onClick={handleAddStudent} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                          <PlusCircleIcon className="h-4 w-4 mr-2" />
                          Add New Student
                        </button>
                        <button onClick={handleAddSubject} className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <PlusCircleIcon className="h-4 w-4 mr-2" />
                          Add New Subject
                        </button>
                      </div>
                    </div>
                    {/* ... System Status and Upcoming Events ... */}
                  </div>
                </div>}
                {/* Students Tab Content */}
                {activeTab === 'students' && <div className="bg-white rounded-lg shadow-md">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <h2 className="text-lg font-medium text-gray-900">
                        Student Management
                      </h2>
                      <div className="mt-3 md:mt-0 flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                          </div>
                          <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <select value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)} className="block w-full sm:w-40 py-2 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                          <option value="all">All Students</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="graduated">Graduated</option>
                        </select>
                        <button onClick={handleAddStudent} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                          <PlusCircleIcon className="h-4 w-4 mr-2" />
                          Add Student
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrollment Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subjects
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map(student => <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.enrollmentDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              {student.subjects}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                                  <div className={`h-2 rounded-full ${student.progress >= 80 ? 'bg-green-500' : student.progress >= 40 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{
                              width: `${student.progress}%`
                            }}></div>
                                </div>
                                <span className="text-xs">
                                  {student.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${student.status === 'Active' ? 'bg-green-100 text-green-800' : student.status === 'Graduated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900" title="View Details">
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-900" title="Edit" onClick={() => handleEditStudent(student)}>
                                  <EditIcon className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900" title="Delete" onClick={() => handleDeleteStudent(student.id)}>
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>
                  {filteredStudents.length === 0 && <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">
                        No students found matching your search criteria.
                      </p>
                    </div>}
                </div>}
                {/* Subjects Tab Content */}
                {activeTab === 'subjects' && (
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-medium text-gray-900">
                          Subjects Management
                        </h2>
                        <div className="mt-3 md:mt-0">
                          <button onClick={handleAddSubject} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                            <PlusCircleIcon className="h-4 w-4 mr-2" />
                            Add Subject
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Students
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Capacity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Schedule
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subjects.map(subject => <tr key={subject.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.students}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.capacity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.schedule}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button className="text-blue-600 hover:text-blue-900" title="View">
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button className="text-green-600 hover:text-green-900" title="Edit" onClick={() => handleEditSubject(subject)}>
                                  <EditIcon className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900" title="Delete" onClick={() => handleDeleteSubject(subject.id)}>
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Announcements Tab Content */}
                {activeTab === 'announcements' && (
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">
                        Announcements Management
                      </h2>
                    </div>
                    <div className="p-6 space-y-6">
                      {announcements.map(announcement => <div key={announcement.id} className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{
                    borderColor: announcement.priority === 'high' ? '#ef4444' : announcement.priority === 'medium' ? '#f59e0b' : '#10b981'
                  }}>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {announcement.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Posted on {announcement.date}
                              </p>
                            </div>
                            <div className="mt-3 md:mt-0 flex items-center">
                              <span className={`mr-4 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${announcement.priority === 'high' ? 'bg-red-100 text-red-800' : announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}{' '}
                                Priority
                              </span>
                              <div className="flex space-x-2">
                                <button className="text-gray-600 hover:text-gray-900">
                                  <EditIcon className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-4">
                            {announcement.message}
                          </p>
                        </div>)}
                    </div>
                  </div>
                )}
                {showStudentForm && <StudentForm initial={editStudent || undefined} onSubmit={handleStudentFormSubmit} onCancel={() => setShowStudentForm(false)} />}
                {showSubjectForm && <SubjectForm initial={editSubject || undefined} onSubmit={handleSubjectFormSubmit} onCancel={() => setShowSubjectForm(false)} />}
              </>
            )}
            {/* Other sidebar items remain as placeholders */}
            {activeSidebarItem === 'schedule' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Schedule</h2>
                <p className="text-gray-600">This is the schedule management section. (Feature coming soon!)</p>
              </div>
            )}
            {activeSidebarItem === 'assessments' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Assessments</h2>
                <p className="text-gray-600">This is the assessments management section. (Feature coming soon!)</p>
              </div>
            )}
            {activeSidebarItem === 'reports' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Reports</h2>
                <p className="text-gray-600">This is the reports section. (Feature coming soon!)</p>
              </div>
            )}
            {activeSidebarItem === 'settings' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Settings</h2>
                <p className="text-gray-600">This is the settings section. (Feature coming soon!)</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;