import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'

const Inicio = lazy(() => import('./pages/Inicio'))
const Conteudo = lazy(() => import('./pages/Conteudo'))
const Simulados = lazy(() => import('./pages/Simulados'))
const CadernoErros = lazy(() => import('./pages/CadernoErros'))
const Evolucao = lazy(() => import('./pages/Evolucao'))
const Prontidao = lazy(() => import('./pages/Prontidao'))
const Engajamento = lazy(() => import('./pages/Engajamento'))

const Spinner = () => (
  <div className="flex h-screen items-center justify-center text-sm text-gray-400">Carregando…</div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="conteudo" element={<Conteudo />} />
            <Route path="simulados" element={<Simulados />} />
            <Route path="caderno" element={<CadernoErros />} />
            <Route path="evolucao" element={<Evolucao />} />
            <Route path="prontidao" element={<Prontidao />} />
            <Route path="conquistas" element={<Engajamento />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
