import { EyeIcon, CheckCircleIcon, XIcon, TrashIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sendStatusEmail } from '../../services/notificationService';

export const EnrollmentTable = ({
  filteredStudents,
  setSelectedStudent,
  selectedFilter,
  setSelectedFilter,
  updateStudent,
  deleteStudent,
  setPromptModal,
  setIsPromptSubmitting
}: any) => {
  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50">
        <div>
          <h3 className="text-2xl font-black tracking-tight mb-1 uppercase font-display">Learner Pipeline</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Registry: {filteredStudents.length} Profiles</p>
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
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="p-4 sm:p-10 overflow-x-auto hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="text-left font-display">
              <th className="px-6 pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">#</th>
              <th className="px-6 pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
              <th className="px-6 pb-8 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordinator Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStudents.map((s: any, i: number) => (
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
                      </div>
                   </div>
                </td>
                <td className="px-6 py-8 text-right">
                   <div className="flex items-center justify-end gap-1.5">
                     <button 
                       onClick={() => setSelectedStudent(s)}
                       className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm active:scale-90"
                       title="View Details"
                     >
                       <EyeIcon size={16} />
                     </button>
                     
                     {s.status !== 'enrolled' && (
                       <button 
                         onClick={() => {
                           setPromptModal({
                             title: 'Approve Learner',
                             fields: [{ name: 'note', label: 'Welcome Note', placeholder: 'e.g. Welcome to ALS-Hamtic!' }],
                             onSubmit: async (data: any) => {
                               setIsPromptSubmitting(true);
                               await updateStudent(s.id, { status: 'enrolled' });
                               await sendStatusEmail(s.name, s.email, 'enrolled');
                               toast.success('Learner approved!');
                               setPromptModal(null);
                               setIsPromptSubmitting(false);
                             }
                           });
                         }}
                         className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                         title="Approve"
                        >
                         <CheckCircleIcon size={16} />
                       </button>
                     )}
                     

                     <button 
                       onClick={() => {
                         setPromptModal({
                           title: 'Decline Application',
                           fields: [{ name: 'reason', label: 'Reason for Rejection', placeholder: 'e.g. Ineligible' }],
                           onSubmit: async (data: any) => {
                             setIsPromptSubmitting(true);
                             await updateStudent(s.id, { status: 'rejected' });
                             await sendStatusEmail(s.name, s.email, 'rejected', data.reason);
                             toast.success('Application rejected');
                             setPromptModal(null);
                             setIsPromptSubmitting(false);
                           }
                         });
                       }}
                       className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                       title="Reject"
                     >
                       <XIcon size={16} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-50 p-6">
        {filteredStudents.map((s: any, i: number) => (
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
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setSelectedStudent(s)} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Preview Details</button>
               <button onClick={() => {
                  if (window.confirm('Are you sure you want to PERMANENTLY delete this student record? This action cannot be undone.')) {
                    deleteStudent(s.id);
                  }
               }} className="p-3 bg-red-50 text-red-600 rounded-xl active:bg-red-600 active:text-white transition-all shadow-sm border border-red-100"><TrashIcon size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
