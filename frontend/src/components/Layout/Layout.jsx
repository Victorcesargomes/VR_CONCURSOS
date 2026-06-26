import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, BarChart3 } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/conteudo', icon: BookOpen, label: 'Conteúdo' },
  { to: '/evolucao', icon: BarChart3, label: 'Evolução' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-52 bg-primary-900 text-white flex flex-col shrink-0">
        <div className="group flex items-center gap-3 px-4 py-4 border-b border-primary-700 transition-colors hover:bg-primary-800/50">
          <div className="icon-pop flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 font-extrabold text-white text-xs shadow-glow-accent">
            VR
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">VR Concursos</h1>
            <p className="text-[10px] text-primary-300">Gestão de Estudos</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-700 font-semibold text-white shadow-glow-primary'
                    : 'text-primary-200 hover:translate-x-1 hover:bg-primary-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-400" />}
                  <Icon size={17} className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-primary-700 text-[10px] text-primary-400">VR Concursos</div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-5 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
