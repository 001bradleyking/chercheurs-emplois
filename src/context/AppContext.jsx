import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { STATUS_LABELS } from '../constants'
import { api, getToken, setToken } from '../services/api'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  // Navigation : home | detail | login | register | space
  const [view, setView] = useState('home')
  const [previousView, setPreviousView] = useState('home')
  const [detailReturn, setDetailReturn] = useState('home')
  const [currentOfferId, setCurrentOfferId] = useState(null)

  const [user, setUser] = useState(null)
  const role = user?.role || 'candidat'
  const loggedIn = Boolean(user)
  const [authLoading, setAuthLoading] = useState(true)
  const [spaceTab, setSpaceTab] = useState('dashboard')
  const [pendingOfferId, setPendingOfferId] = useState(null)
  const [registerRole, setRegisterRole] = useState('candidat')

  const [offers, setOffers] = useState([])
  const [filters, setFilters] = useState({ keyword: '', localisation: '', contrat: '' })
  const [userApplications, setUserApplications] = useState([])
  const [userNotifications, setUserNotifications] = useState([])
  const [applyBanner, setApplyBanner] = useState(null)
  const [employerOffers, setEmployerOffers] = useState([])
  const [employerApplications, setEmployerApplications] = useState([])
  const [adminStats, setAdminStats] = useState({ users: 0, offers: 0, reports: 0 })
  const [adminUsers, setAdminUsers] = useState([])
  const [adminOffers, setAdminOffers] = useState([])

  // Modale d'offre
  const [offerModal, setOfferModal] = useState({ open: false, editId: null })

  // Toast
  const [toast, setToast] = useState({ message: '', show: false })
  const toastTimer = useRef(null)
  const showToast = useCallback((message) => {
    setToast({ message, show: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200)
  }, [])

  const bannerTimer = useRef(null)
  useEffect(() => () => { clearTimeout(toastTimer.current); clearTimeout(bannerTimer.current) }, [])

  const clearPrivateData = () => {
    setUser(null)
    setUserApplications([])
    setUserNotifications([])
    setApplyBanner(null)
    setPendingOfferId(null)
    setEmployerOffers([])
    setEmployerApplications([])
    setAdminStats({ users: 0, offers: 0, reports: 0 })
    setAdminUsers([])
    setAdminOffers([])
    setOfferModal({ open: false, editId: null })
    setSpaceTab('dashboard')
  }

  const refreshOffers = useCallback(async () => {
    const result = await api.get('/offers')
    setOffers(result)
    return result
  }, [])

  const refreshSpaceData = useCallback(async (userRole) => {
    if (userRole === 'candidat') {
      const [applications, notifications] = await Promise.all([
        api.get('/applications/mine'),
        api.get('/notifications'),
      ])
      setUserApplications(applications)
      setUserNotifications(notifications)
    } else if (userRole === 'employeur') {
      const [mine, applications, notifications] = await Promise.all([
        api.get('/employer/offers'),
        api.get('/employer/applications'),
        api.get('/notifications'),
      ])
      setEmployerOffers(mine)
      setEmployerApplications(applications)
      setUserNotifications(notifications)
    } else if (userRole === 'admin') {
      const [stats, users, allOffers] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/offers'),
      ])
      setAdminStats(stats)
      setAdminUsers(users)
      setAdminOffers(allOffers)
    }
  }, [])

  useEffect(() => {
    refreshOffers().catch((error) => showToast(error.message))
    let active = true
    const restoreSession = async () => {
      if (!getToken()) {
        if (active) setAuthLoading(false)
        return
      }

      try {
        const currentUser = await api.get('/auth/me')
        await refreshSpaceData(currentUser.role)
        if (!active) return
        setUser(currentUser)
        setView('space')
      } catch (error) {
        setToken(null)
        if (active) {
          clearPrivateData()
          showToast(error.message)
        }
      } finally {
        if (active) setAuthLoading(false)
      }
    }
    restoreSession()
    return () => { active = false }
  }, [refreshOffers, refreshSpaceData, showToast])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearPrivateData()
      setView('home')
    }
    window.addEventListener('api:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('api:unauthorized', handleUnauthorized)
  }, [])

  const currentOffer = offers.find((o) => o.id === currentOfferId) || null
  const scrollTop = () => window.scrollTo(0, 0)

  // --- Navigation ---
  const showHome = () => {
    setSpaceTab('dashboard')
    setView(user ? 'space' : 'home')
    scrollTop()
  }

  const goToCv = () => {
    setSpaceTab('cv')
    setView('space')
    scrollTop()
  }

  const showAuth = (type, roleToSelect = null, isFromApply = false) => {
    if (user) {
      setView('space')
      return
    }
    if (!isFromApply) setPreviousView('home')
    if (type === 'register' && roleToSelect === 'employeur') setRegisterRole('employeur')
    setView(type)
    scrollTop()
  }

  const cancelAuth = () => {
    setView(previousView === 'detail' && currentOffer ? 'detail' : 'home')
    scrollTop()
  }

  const openOfferDetail = (id) => {
    if (!offers.some((offer) => offer.id === id)) {
      showToast("Cette offre n'est plus disponible.")
      return
    }
    setDetailReturn(view === 'space' ? 'space' : 'home')
    setCurrentOfferId(id)
    setPreviousView('detail')
    setView('detail')
    scrollTop()
  }

  const closeOfferDetail = () => { setView(detailReturn); scrollTop() }

  // --- Candidatures ---
  const applyToOffer = async (offerId) => {
    const offer = offers.find((item) => item.id === offerId)
    if (!offer) return
    try {
      await api.post(`/offers/${offerId}/applications`, {})
      await refreshSpaceData('candidat')
      setApplyBanner(`Votre candidature pour « ${offer.titre} » a bien été transmise à l'employeur.`)
      clearTimeout(bannerTimer.current)
      bannerTimer.current = setTimeout(() => setApplyBanner(null), 6000)
      showToast('Candidature envoyée avec succès.')
    } catch (error) {
      if (error.message.includes('Déposez un CV')) goToCv()
      showToast(error.message)
    }
  }

  const handleApply = async () => {
    if (!currentOffer) return
    if (loggedIn && role !== 'candidat') {
      showToast('Seuls les candidats peuvent postuler.')
      return
    }
    if (loggedIn && role === 'candidat') {
      if (!user.cv_name) {
        goToCv()
        showToast('Déposez un CV PDF dans votre profil avant de postuler.')
        return
      }
      await applyToOffer(currentOffer.id)
      setView('space')
      scrollTop()
      return
    }
    setPendingOfferId(currentOffer.id)
    showToast('Connectez-vous pour finaliser votre candidature…')
    setTimeout(() => showAuth('login', null, true), 900)
  }

  const login = async (email, password, onDone) => {
    try {
      const session = await api.post('/auth/login', { email, password })
      setToken(session.token)
      clearPrivateData()
      setSpaceTab('dashboard')
      setUser(session.user)
      await refreshOffers()
      await refreshSpaceData(session.user.role)
      if (pendingOfferId) {
        if (session.user.role === 'candidat' && !session.user.cv_name) {
          goToCv()
          showToast('Déposez un CV PDF avant de finaliser votre candidature.')
        } else if (session.user.role === 'candidat') await applyToOffer(pendingOfferId)
        else showToast('Connectez-vous avec un compte candidat pour postuler.')
        setPendingOfferId(null)
      }
      setView('space')
      scrollTop()
      onDone && onDone()
    } catch (error) {
      setToken(null)
      setUser(null)
      showToast(error.message)
    }
  }

  const registerAccount = async (name, email, password, newRole) => {
    try {
      await api.post('/auth/register', { name, email, password, role: newRole })
      showToast(`Compte ${newRole} créé avec succès !`)
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  const logout = async () => {
    let message = 'Vous êtes déconnecté.'
    try {
      await api.post('/auth/logout', {})
    } catch (error) {
      message = `${error.message} La session locale a été fermée.`
    }
    setToken(null)
    clearPrivateData()
    setView('home')
    scrollTop()
    showToast(message)
  }

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      await api.patch(`/employer/applications/${appId}`, { statut: newStatus })
      await refreshSpaceData('employeur')
      showToast('Statut mis à jour : ' + STATUS_LABELS[newStatus])
    } catch (error) {
      showToast(error.message)
    }
  }

  const toggleOfferStatus = async (offerId) => {
    try {
      const updated = await api.patch(`/employer/offers/${offerId}/status`, {})
      await Promise.all([refreshSpaceData('employeur'), refreshOffers()])
      showToast(updated.statut === 'active' ? 'Offre réactivée' : 'Offre désactivée')
    } catch (error) {
      showToast(error.message)
    }
  }

  const openOfferModal = (editId = null) => setOfferModal({ open: true, editId })
  const closeOfferModal = () => setOfferModal({ open: false, editId: null })

  const submitOffer = async ({ editId, titre, localisation, contrat, description, missions, profil }) => {
    const payload = { titre, localisation, contrat, description, missions, profil }
    try {
      if (editId) await api.patch(`/employer/offers/${editId}`, payload)
      else await api.post('/employer/offers', payload)
      await Promise.all([refreshOffers(), refreshSpaceData('employeur')])
      showToast(editId ? 'Offre modifiée avec succès' : 'Offre publiée avec succès !')
      closeOfferModal()
    } catch (error) {
      showToast(error.message)
    }
  }

  const updateProfile = async (payload) => {
    try {
      const updated = await api.patch('/profile', payload)
      setUser(updated)
      showToast('Profil enregistré')
    } catch (error) {
      showToast(error.message)
    }
  }

  const markNotificationsRead = async () => {
    const unread = userNotifications.filter((notification) => notification.unread)
    if (unread.length === 0) return

    try {
      await Promise.all(unread.map((notification) => api.patch(`/notifications/${notification.id}/read`, {})))
      setUserNotifications(await api.get('/notifications'))
    } catch (error) {
      showToast(error.message)
    }
  }

  const uploadCv = async (file) => {
    try {
      const updated = await api.upload('/profile/cv', file)
      setUser(updated)
      showToast('CV téléversé avec succès')
    } catch (error) {
      showToast(error.message)
    }
  }

  const downloadCv = async () => {
    try {
      const file = await api.download('/profile/cv')
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = user?.cv_name || 'cv.pdf'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      showToast(error.message)
    }
  }

  const downloadCandidateCv = async (applicationId, filename) => {
    try {
      const file = await api.download(`/employer/applications/${applicationId}/cv`)
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'cv.pdf'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      showToast(error.message)
    }
  }

  const updateAdminUserStatus = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: isActive })
      await refreshSpaceData('admin')
      showToast(isActive ? 'Compte réactivé' : 'Compte désactivé')
    } catch (error) {
      showToast(error.message)
    }
  }

  const removeAdminOffer = async (offerId) => {
    try {
      await api.patch(`/admin/offers/${offerId}/status`, { statut: 'removed' })
      await Promise.all([refreshSpaceData('admin'), refreshOffers()])
      showToast('Offre retirée')
    } catch (error) {
      showToast(error.message)
    }
  }

  const value = {
    view, role, loggedIn, user, authLoading, spaceTab, setSpaceTab, registerRole, setRegisterRole,
    offers, filters, setFilters, currentOffer,
    userApplications, userNotifications, applyBanner,
    employerOffers, employerApplications, adminStats, adminUsers, adminOffers,
    offerModal, toast,
    showToast, showHome, showAuth, cancelAuth, openOfferDetail, closeOfferDetail, goToCv,
    handleApply, login, registerAccount, logout,
    updateApplicationStatus, toggleOfferStatus, openOfferModal, closeOfferModal, submitOffer,
    updateProfile, markNotificationsRead, uploadCv, downloadCv, downloadCandidateCv, updateAdminUserStatus, removeAdminOffer,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
