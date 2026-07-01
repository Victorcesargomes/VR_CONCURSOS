import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { AlertTriangle, BarChart3, BookOpen, ChevronLeft, ChevronRight, LayoutDashboard, Menu, Target, Timer, Trophy, X } from 'lucide-react'
import ConquistaToast from '../Toast/ConquistaToast'
import SearchPalette from '../Search/SearchPalette'
import { useLocalStorage } from '../../hooks/useLocalStorage'

const navInicio = [{ to: '/', icon: LayoutDashboard, label: 'Início' }]

const navSections = [
  {
    titulo: 'Estudo',
    items: [
      { to: '/conteudo', icon: BookOpen, label: 'Conteúdo' },
      { to: '/simulados', icon: Timer, label: 'Simulados' },
      { to: '/caderno', icon: AlertTriangle, label: 'Caderno de Erros' },
    ],
  },
  {
    titulo: 'Acompanhamento',
    items: [
      { to: '/evolucao', icon: BarChart3, label: 'Evolução' },
      { to: '/prontidao', icon: Target, label: 'Prontidão' },
      { to: '/conquistas', icon: Trophy, label: 'Conquistas' },
    ],
  },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorage('vr.sidebar.collapsed', false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Backdrop no mobile */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMenu} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-primary-900 to-primary-950 text-white transition-all duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'lg:w-[72px]' : 'lg:w-56'}`}>
        {/* Detalhes decorativos de marca */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent-400/40 to-transparent" />

        {/* Fechar (só mobile) */}
        <button onClick={closeMenu} aria-label="Fechar menu" className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-primary-200 hover:bg-white/10 hover:text-white lg:hidden">
          <X size={18} />
        </button>

        {/* Recolher / expandir (só desktop) */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="absolute right-2 top-2 z-10 hidden h-8 w-8 items-center justify-center rounded-lg text-primary-200 hover:bg-white/10 hover:text-white lg:flex"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Marca / logo */}
        <div className="flex justify-center px-3 pt-4 pb-3">
          <div className={`hover-lift group relative overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/15 ${collapsed ? 'lg:hidden' : ''}`}>
            <img src="/logo.png" alt="VR Concursos" className="block h-11 w-auto object-contain" />
            <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className={`hidden h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-primary-800 shadow-lg ring-1 ring-white/15 ${collapsed ? 'lg:flex' : ''}`}>VR</div>
        </div>

        {/* Navegação */}
        <nav className="relative flex-1 overflow-y-auto px-2 pb-2">
          <ul className="space-y-0.5">
            {navInicio.map((item) => <NavItem key={item.to} {...item} collapsed={collapsed} onClose={closeMenu} />)}
          </ul>
          {navSections.map((sec) => (
            <div key={sec.titulo} className="mt-3">
              <p className={`px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-300/70 ${collapsed ? 'lg:hidden' : ''}`}>{sec.titulo}</p>
              <ul className="space-y-0.5">
                {sec.items.map((item) => <NavItem key={item.to} {...item} collapsed={collapsed} onClose={closeMenu} />)}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rodapé de marca */}
        <div className={`relative flex items-center gap-2 border-t border-white/10 px-4 py-3 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-500/15 text-[10px] font-extrabold text-accent-300 ring-1 ring-accent-400/25">VR</div>
          <div className={`leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
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

      <ConquistaToast />
      <SearchPalette />
    </div>
  )
}

function NavItem({ to, icon: Icon, label, collapsed, onClose }) {
  return (
    <li>
      <NavLink
        to={to} end={to === '/'} onClick={onClose}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          [
            'group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm transition-all duration-200',
            collapsed ? 'lg:justify-center lg:px-0' : '',
            isActive
              ? 'bg-primary-700 font-semibold text-white shadow-glow-primary'
              : collapsed
                ? 'text-primary-200 hover:bg-white/5 hover:text-white'
                : 'text-primary-200 hover:translate-x-1 hover:bg-white/5 hover:text-white',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-400" />}
            <Icon size={17} className={`shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
            <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}
