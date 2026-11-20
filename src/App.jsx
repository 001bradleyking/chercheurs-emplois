import { useApp } from './context/AppContext'
import Home from './pages/Home'
import OfferDetail from './pages/OfferDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import CandidateSpace from './pages/CandidateSpace'
import EmployerSpace from './pages/EmployerSpace'
import AdminSpace from './pages/AdminSpace'
import OfferModal from './components/OfferModal'
import Toast from './components/Toast'

export default function App() {
  const { view, role, authLoading, loggedIn } = useApp()

  if (authLoading) return <div className="app-loading" role="status">Chargement de votre espace…</div>

  return (
    <>
      {view === 'home' && !loggedIn && <Home />}
      {view === 'detail' && <OfferDetail />}
      {view === 'login' && <Login />}
      {view === 'register' && <Register />}
      {view === 'space' && role === 'candidat' && <CandidateSpace />}
      {view === 'space' && role === 'employeur' && <EmployerSpace />}
      {view === 'space' && role === 'admin' && <AdminSpace />}
      <OfferModal />
      <Toast />
    </>
  )
}
