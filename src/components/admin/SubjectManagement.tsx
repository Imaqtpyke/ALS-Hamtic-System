import { BookOpenIcon, TrashIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const SubjectManagement = ({ 
  subjects, 
  setPromptModal, 
  setIsPromptSubmitting, 
  addSubject, 
  updateSubject, 
  deleteSubject 
}: any) => {
  return (
    <div className="space-y-10">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Subjects</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure available Subjects for Enrollment</p>
          </div>
          <button 
            onClick={() => setPromptModal({
              title: 'Create New Subject',
              fields: [
                { name: 'name', label: 'Subject Name', placeholder: 'e.g. Life and Career Skills', type: 'text' }
              ],
              onSubmit: async (data: any) => {
                if (!data.name) return toast.error('Subject name is required');
                if (subjects.some((s: any) => s.name.toLowerCase() === data.name.toLowerCase())) {
                  return toast.error('A subject with this name already exists');
                }
                setIsPromptSubmitting(true);
                try {
                  await addSubject({
                    name: data.name,
                    capacity: 25, // Default capacity
                    students: 0,
                    schedule: 'To be announced'
                  });
                  toast.success('New academic subject created!');
                  setPromptModal(null);
                } catch (err) {
                  toast.error('Failed to create subject');
                } finally {
                  setIsPromptSubmitting(false);
                }
              }
            })}
            className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm"
          >
            Add Academic Subject
          </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((s: any) => (
             <div key={s.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:border-red-600 transition-all duration-300">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                   <BookOpenIcon size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Official Subject</p>
                <h3 className="text-2xl font-black text-gray-900 mb-6 font-display leading-none uppercase tracking-tight line-clamp-2 min-h-[3rem]">{s.name}</h3>
                
                <div className="flex gap-3 pt-6 border-t border-gray-50">
                   <button 
                     onClick={() => setPromptModal({
                       title: 'Modify Subject',
                       fields: [
                         { name: 'name', label: 'Subject Name', defaultValue: s.name, type: 'text' }
                       ],
                       onSubmit: async (data: any) => {
                         setIsPromptSubmitting(true);
                         try {
                           const finalName = data.name || s.name;
                           
                           await updateSubject(s.id, {
                             name: finalName,
                             capacity: s.capacity // Keep existing capacity
                           });
                           toast.success('Subject updated successfully');
                           setPromptModal(null);
                         } catch (err) {
                           toast.error('Failed to update subject');
                         } finally {
                           setIsPromptSubmitting(false);
                         }
                       }
                     })}
                     className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                   >
                     Manage
                   </button>
                   <button 
                     onClick={() => {
                       if(window.confirm(`Remove "${s.name}"? This will disable this subject for new enrollments.`)) {
                         deleteSubject(s.id);
                         toast.success('Subject removed from registry');
                       }
                     }}
                     className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100"
                   >
                     <TrashIcon size={16} />
                   </button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
