import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Inicio from './pages/Inicio'
import Conteudo from './pages/Conteudo'
import Evolucao from './pages/Evolucao'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="conteudo" element={<Conteudo />} />
          <Route path="evolucao" element={<Evolucao />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
