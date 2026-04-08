import { EditIcon, TrashIcon } from 'lucide-react';

export const AnnouncementManager = ({ announcements, handleAddAnnouncement, handleEditAnnounce, handleDeleteAnnounce }: any) => {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black tracking-tighter uppercase font-display">System Notices</h2>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Communication Center</p>
        </div>
        <button onClick={handleAddAnnouncement} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm">Post New Notice</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {announcements.map((ann: any) => (
            <div key={ann.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col group hover:border-red-500 transition-all duration-500">
               <div className="flex justify-between items-start mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    ann.priority === 'high' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-50 text-blue-600'
                  }`}>{ann.priority}</span>
                  <div className="flex gap-2">
                     <button onClick={() => handleEditAnnounce(ann)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><EditIcon size={16} className="text-gray-300 group-hover:text-blue-600" /></button>
                     <button onClick={() => handleDeleteAnnounce(ann.id)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><TrashIcon size={16} className="text-gray-300 group-hover:text-red-600" /></button>
                  </div>
               </div>
               <h3 className="text-xl font-black mb-4 group-hover:text-red-600 transition-colors uppercase leading-[0.9]">{ann.title}</h3>
               <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">{ann.message}</p>
               <div className="mt-auto pt-6 border-t border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {new Date(ann.date).toLocaleDateString()} @ {new Date(ann.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
