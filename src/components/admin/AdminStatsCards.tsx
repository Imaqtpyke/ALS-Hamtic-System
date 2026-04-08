export const StatCard = ({ icon, title, value, change, color }: any) => (
  <div className={`bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-red-100 transition-all`}>
    <div className={`${color} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">{change}</span>
      </div>
    </div>
  </div>
);
