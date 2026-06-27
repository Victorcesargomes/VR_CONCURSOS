export default function PageHeader({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 text-white shadow-glow-primary ring-1 ring-white/10">
            <Icon size={19} />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
