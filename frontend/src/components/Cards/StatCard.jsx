export default function StatCard({ label, value, icon: Icon, color = 'primary', className = '' }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200 group-hover:bg-primary-100',
    accent: 'bg-accent-50 text-accent-700 border-accent-200 group-hover:bg-accent-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 group-hover:bg-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 group-hover:bg-slate-100',
  }
  const barClasses = {
    primary: 'from-primary-400 to-primary-600',
    accent: 'from-accent-400 to-accent-600',
    amber: 'from-amber-400 to-amber-500',
    rose: 'from-rose-400 to-rose-500',
    slate: 'from-slate-400 to-slate-500',
  }

  return (
    <div className={`hover-lift group relative overflow-hidden bg-white rounded-xl border border-gray-200 p-5 shadow-card ${className}`}>
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barClasses[color] || barClasses.primary} opacity-80`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 transition-transform duration-200 group-hover:scale-[1.04] origin-left">{value}</p>
        </div>
        <div className={`icon-pop flex w-11 h-11 items-center justify-center rounded-lg border ${colorClasses[color] || colorClasses.primary}`}>
          {Icon && <Icon size={22} />}
        </div>
      </div>
    </div>
  )
}
