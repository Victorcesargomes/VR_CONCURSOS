import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { BarChart3, BookOpen, LayoutDashboard, Menu, X } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/conteudo', icon: BookOpen, label: 'Conteúdo' },
  { to: '/evolucao', icon: BarChart3, label: 'Evolução' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Backdrop no mobile */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMenu} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-primary-900 to-primary-950 text-white transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Detalhes decorativos de marca */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent-400/40 to-transparent" />

        {/* Fechar (só mobile) */}
        <button onClick={closeMenu} aria-label="Fechar menu" className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-primary-200 hover:bg-white/10 hover:text-white lg:hidden">
          <X size={18} />
        </button>

        {/* Marca / logo */}
        <div className="relative px-3 pt-4 pb-3">
          <div className="hover-lift group relative overflow-hidden rounded-xl bg-white p-2 shadow-lg ring-1 ring-white/15">
            <img src="/logo.png" alt="VR Concursos" className="block w-full" />
            <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </div>

        {/* Navegação */}
        <nav className="relative flex-1 overflow-y-auto px-2 pb-2">
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-300/70">Menu</p>
          <ul className="space-y-0.5">
            {links.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to} end={to === '/'} onClick={closeMenu}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-700 font-semibold text-white shadow-glow-primary'
                        : 'text-primary-200 hover:translate-x-1 hover:bg-white/5 hover:text-white'
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
              </li>
            ))}
          </ul>
        </nav>

        {/* Rodapé de marca */}
        <div className="relative flex items-center gap-2 border-t border-white/10 px-4 py-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-500/15 text-[10px] font-extrabold text-accent-300 ring-1 ring-accent-400/25">VR</div>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold text-white/80">VR Concursos</p>
            <p className="text-[9px] text-primary-300/70">Gestão de Estudos</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (só mobile) */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2.5 lg:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="btn-pop flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-700 to-primary-900 text-[10px] font-extrabold text-white shadow-glow-primary">VR</div>
            <span className="font-bold text-gray-900">VR Concursos</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-7xl p-4 sm:p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
