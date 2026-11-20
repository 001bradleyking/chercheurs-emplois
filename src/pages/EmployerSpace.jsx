import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { STATUS_LABELS } from '../constants'
import Icon, { RawSvg } from '../components/Icon'
import LogoMark from '../components/LogoMark'

function EmptyBlock({ icon, title, text }) {
  return (
    <div className="empty-space"><RawSvg name={icon} /><h3>{title}</h3><p>{text}</p></div>
  )
}

function ApplicationRow({ a, onStatus, downloadCandidateCv }) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="application-item application-row" style={{ cursor: 'default', flexWrap: 'wrap' }}>
      <div className="app-logo" style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}>{a.candidat.charAt(0)}</div>
      <div className="app-info">
        <div className="app-title">{a.candidat}</div>
        <div className="app-company">{a.email} · Candidature {a.date}</div>
        <div className="app-date" style={{ color: 'var(--primary)', fontWeight: 600 }}><Icon name="file" size="xs" />{a.cv}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>{profileOpen ? 'Masquer le profil' : 'Voir le profil'}</button>
        <select className="no-icon" style={{ minHeight: 36, padding: '6px 12px', fontSize: '0.85rem', borderRadius: 8 }} value={a.statut} onChange={(e) => onStatus(a.id, e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" disabled={!a.cvDisponible} onClick={() => downloadCandidateCv(a.id, a.cv)}>Voir CV</button>
      </div>
      {profileOpen && (
        <div className="candidate-profile">
          <strong>Profil professionnel</strong>
          <p>{a.profil?.bio || 'Le candidat n’a pas encore renseigné sa bio.'}</p>
          {a.profil?.localisation && <span><Icon name="pin" size="xs" />{a.profil.localisation}</span>}
          {a.profil?.competences?.length > 0 && <div className="profile-skills">{a.profil.competences.map((skill) => <span key={skill}>{skill}</span>)}</div>}
        </div>
      )}
    </div>
  )
}

export default function EmployerSpace() {
  const {
    user, employerOffers, employerApplications, userNotifications, showHome, logout, updateProfile, downloadCandidateCv, markNotificationsRead,
    openOfferModal, toggleOfferStatus, updateApplicationStatus,
  } = useApp()
  const [tab, setTab] = useState('dashboard')
  const [filterOffer, setFilterOffer] = useState('')
  const [profile, setProfile] = useState({ company_name: '', sector: '', location: '', company_description: '' })

  useEffect(() => {
    setProfile({
      company_name: user?.company_name || user?.name || '',
      sector: user?.sector || '',
      location: user?.location || '',
      company_description: user?.company_description || '',
    })
  }, [user])

  const activeOffers = employerOffers.filter((o) => o.statut === 'active').length
  const filteredApps = filterOffer ? employerApplications.filter((a) => String(a.offerId) === filterOffer) : employerApplications
  const unread = userNotifications.filter((notification) => notification.unread).length
  const badgeStyle = { display: unread > 0 ? 'grid' : 'none' }

  const navLink = (id, icon, label, extra) => (
    <a className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon name={icon} />{label}{extra}</a>
  )

  return (
    <div className="space-view active" id="viewEmployerSpace">
      <header className="space-topbar">
        <div className="container space-topbar-inner">
          <a className="logo" onClick={showHome}>
            <LogoMark id="lgEmp" />
            <span className="logo-text"><span className="brand-main">Chercheurs d'Emplois</span><span className="brand-sub">Espace employeur</span></span>
          </a>
          <div className="space-actions">
            <button className="icon-btn" onClick={() => { setTab('notifications'); markNotificationsRead() }} title="Notifications">
              <Icon name="bell" />
              <span className="count" style={badgeStyle}>{unread}</span>
            </button>
            <div className="user-chip">
              <div className="user-avatar">{(user?.company_name || user?.name || 'E').slice(0, 2).toUpperCase()}</div>
              <div className="user-chip-label"><div className="user-name">{user?.company_name || user?.name}</div><div className="user-role">Employeur</div></div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-layout">
        <aside className="space-sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-label">Espace employeur</div>
            {navLink('dashboard', 'grid', 'Tableau de bord')}
            {navLink('offres', 'briefcase', 'Mes offres')}
            {navLink('candidatures', 'fileLines', 'Candidatures reçues')}
            {navLink('profil', 'user', 'Profil employeur')}
            <a className={tab === 'notifications' ? 'active' : ''} onClick={() => { setTab('notifications'); markNotificationsRead() }}><Icon name="bell" />Notifications<span className="count-pill" style={badgeStyle}>{unread}</span></a>
            <div className="sidebar-divider"></div>
            <a onClick={logout}><Icon name="logout" />Déconnexion</a>
          </nav>
        </aside>

        <main className="space-main">
          {tab === 'dashboard' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Bonjour {user?.company_name || user?.name}</h1><p>Voici un aperçu de votre activité de recrutement.</p></div>
              <div className="space-stats">
                <div className="space-stat"><div className="space-stat-icon blue"><Icon name="briefcase" /></div><div><div className="space-stat-value">{activeOffers}</div><div className="space-stat-label">Offres actives</div></div></div>
                <div className="space-stat"><div className="space-stat-icon orange"><Icon name="file" /></div><div><div className="space-stat-value">{employerApplications.length}</div><div className="space-stat-label">Candidatures reçues</div></div></div>
                <div className="space-stat"><div className="space-stat-icon green"><Icon name="check" /></div><div><div className="space-stat-value">{employerApplications.filter((application) => application.statut === 'acceptee').length}</div><div className="space-stat-label">Profils acceptés</div></div></div>
                <div className="space-stat"><div className="space-stat-icon purple"><Icon name="clock" /></div><div><div className="space-stat-value">{employerOffers.filter((offer) => offer.statut === 'inactive').length}</div><div className="space-stat-label">Offres en attente</div></div></div>
              </div>
              <div className="space-section">
                <div className="space-section-header"><h2>Dernières candidatures reçues</h2><button className="btn btn-ghost" onClick={() => setTab('candidatures')}>Voir tout</button></div>
                <div>
                  {employerApplications.length === 0
                    ? <EmptyBlock icon="file" title="Aucune candidature" text="Vous n'avez pas encore reçu de candidature." />
                    : employerApplications.slice(0, 3).map((a) => <ApplicationRow key={a.id} a={a} onStatus={updateApplicationStatus} downloadCandidateCv={downloadCandidateCv} />)}
                </div>
              </div>
            </div>
          )}

          {tab === 'offres' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Mes offres d'emploi</h1><p>Gérez vos offres publiées et créez-en de nouvelles.</p></div>
              <div className="space-section">
                <div className="space-section-header">
                  <h2>Liste de mes offres</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => openOfferModal()}><Icon name="plus" size="sm" />Nouvelle offre</button>
                </div>
                <div>
                  {employerOffers.length === 0 ? (
                    <EmptyBlock icon="briefcase" title="Aucune offre publiée" text="Créez votre première offre pour recevoir des candidatures." />
                  ) : (
                    employerOffers.map((o) => (
                      <div className="application-item" key={o.id} style={{ cursor: 'default' }}>
                        <div className="app-logo" style={{ background: o.statut === 'active' ? '#2563eb' : '#94a3b8' }}>{o.titre.charAt(0)}</div>
                        <div className="app-info">
                          <div className="app-title">{o.titre}</div>
                          <div className="app-company">{o.localisation} · {o.contrat} · {o.date}</div>
                          <div className="app-date" style={{ color: 'var(--primary)', fontWeight: 600 }}><Icon name="file" size="xs" />{o.candidatures} candidature(s)</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openOfferModal(o.id)}>Modifier</button>
                          <button className={`btn ${o.statut === 'active' ? 'btn-danger' : 'btn-success'} btn-sm`} onClick={() => toggleOfferStatus(o.id)}>{o.statut === 'active' ? 'Désactiver' : 'Réactiver'}</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'candidatures' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Candidatures reçues</h1><p>Consultez les profils et mettez à jour le statut des candidatures.</p></div>
              <div className="space-section">
                <div className="space-section-header">
                  <h2>Toutes les candidatures</h2>
                  <select className="no-icon" style={{ width: 'auto', minHeight: 40, padding: '8px 14px' }} value={filterOffer} onChange={(e) => setFilterOffer(e.target.value)}>
                    <option value="">Toutes les offres</option>
                    {employerOffers.map((o) => <option key={o.id} value={o.id}>{o.titre}</option>)}
                  </select>
                </div>
                <div>
                  {filteredApps.length === 0
                    ? <EmptyBlock icon="file" title="Aucune candidature" text="Vous n'avez pas encore reçu de candidature." />
                    : filteredApps.map((a) => <ApplicationRow key={a.id} a={a} onStatus={updateApplicationStatus} downloadCandidateCv={downloadCandidateCv} />)}
                </div>
              </div>
            </div>
          )}

          {tab === 'profil' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Profil employeur</h1><p>Renseignez les informations de votre entreprise.</p></div>
              <div className="space-section">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Informations de l'entreprise</h2>
                <div className="form-group"><label>Nom de l'entreprise</label><input type="text" value={profile.company_name} onChange={(e) => setProfile((current) => ({ ...current, company_name: e.target.value }))} className="no-icon" /></div>
                <div className="form-group"><label>Secteur d'activité</label><input type="text" value={profile.sector} onChange={(e) => setProfile((current) => ({ ...current, sector: e.target.value }))} className="no-icon" /></div>
                <div className="form-group"><label>Localisation</label><input type="text" value={profile.location} onChange={(e) => setProfile((current) => ({ ...current, location: e.target.value }))} className="no-icon" /></div>
                <div className="form-group"><label>Description</label><textarea className="no-icon" value={profile.company_description} onChange={(e) => setProfile((current) => ({ ...current, company_description: e.target.value }))} /></div>
                <button className="btn btn-primary" onClick={() => updateProfile(profile)}><Icon name="check" size="sm" />Enregistrer</button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Notifications</h1><p>Suivez les événements importants liés à vos offres.</p></div>
              <div className="space-section">
                <div>
                  {userNotifications.length === 0
                    ? <EmptyBlock icon="bell" title="Aucune notification" text="Vous serez informé des événements importants ici." />
                    : userNotifications.map((notification) => (
                      <div className="application-item" key={notification.id} style={{ cursor: 'default' }}>
                        <div className="app-logo" style={{ background: notification.unread ? 'linear-gradient(135deg, #2563eb, #60a5fa)' : 'var(--bg-alt)' }}><Icon name="bell" size="sm" stroke={notification.unread ? '#fff' : 'var(--muted)'} /></div>
                        <div className="app-info"><div className="app-title">{notification.titre}</div><div className="app-company" style={{ whiteSpace: 'normal' }}>{notification.message}</div><div className="app-date"><Icon name="clock" size="xs" />{notification.date}</div></div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
