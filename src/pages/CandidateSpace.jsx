import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { STATUS_LABELS } from '../constants'
import Icon, { RawSvg } from '../components/Icon'
import LogoMark from '../components/LogoMark'

function ApplicationList({ items, openOfferDetail }) {
  if (items.length === 0) {
    return (
      <div className="empty-space">
        <RawSvg name="file" />
        <h3>Aucune candidature pour le moment</h3>
        <p>Explorez les offres et postulez en un clic.</p>
      </div>
    )
  }
  return items.map((a) => (
    <div className="application-item" key={a.offerId} onClick={() => openOfferDetail(a.offerId)}>
      <div className="app-logo" style={{ background: a.couleur }}>{a.initiales}</div>
      <div className="app-info">
        <div className="app-title">{a.titre}</div>
        <div className="app-company">{a.entreprise}</div>
        <div className="app-date"><Icon name="clock" size="xs" />{a.date}</div>
      </div>
      <span className={`app-status status-${a.statut}`}>{STATUS_LABELS[a.statut]}</span>
    </div>
  ))
}

export default function CandidateSpace() {
  const {
    user, offers, userApplications, userNotifications, applyBanner, spaceTab: tab, setSpaceTab: setTab,
    openOfferDetail, showHome, logout, updateProfile, markNotificationsRead, uploadCv, downloadCv,
  } = useApp()
  const [profile, setProfile] = useState({ name: '', location: '', skills: '', bio: '' })
  const [feedSearch, setFeedSearch] = useState('')
  const cvInput = useRef(null)

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      location: user?.location || '',
      skills: (user?.skills || []).join(', '),
      bio: user?.bio || '',
    })
  }, [user])

  const skillTerms = (user?.skills || []).map((skill) => skill.toLowerCase())
  const searchTerm = feedSearch.trim().toLowerCase()
  const feedOffers = offers
    .map((offer, index) => {
      const searchable = `${offer.titre} ${offer.entreprise} ${offer.localisation} ${offer.description}`.toLowerCase()
      const relevance = skillTerms.filter((skill) => searchable.includes(skill)).length
      return { offer, index, relevance }
    })
    .filter(({ offer }) => !searchTerm || `${offer.titre} ${offer.entreprise} ${offer.localisation} ${offer.description}`.toLowerCase().includes(searchTerm))
    .sort((a, b) => b.relevance - a.relevance || a.index - b.index)
    .slice(0, 6)
  const profileCompletion = Math.round(
    ([user?.name, user?.location, user?.bio, user?.cv_name, user?.skills?.length ? 'skills' : ''].filter(Boolean).length / 5) * 100,
  )

  const unread = userNotifications.filter((n) => n.unread).length
  const badgeStyle = { display: unread > 0 ? 'grid' : 'none' }
  const navLink = (id, icon, label, extra, onClick) => (
    <a className={tab === id ? 'active' : ''} onClick={() => { setTab(id); onClick?.() }}><Icon name={icon} />{label}{extra}</a>
  )

  return (
    <div className="space-view active" id="viewCandidateSpace">
      <header className="space-topbar">
        <div className="container space-topbar-inner">
          <a className="logo" onClick={showHome}>
            <LogoMark id="lgCand" />
            <span className="logo-text"><span className="brand-main">Chercheurs d'Emplois</span><span className="brand-sub">Espace candidat</span></span>
          </a>
          <div className="space-actions">
            <button className="icon-btn" onClick={() => { setTab('notifications'); markNotificationsRead() }} title="Notifications">
              <Icon name="bell" />
              <span className="count" style={badgeStyle}>{unread}</span>
            </button>
            <div className="user-chip">
              <div className="user-avatar">{(user?.name || 'C').slice(0, 2).toUpperCase()}</div>
              <div className="user-chip-label"><div className="user-name">{user?.name}</div><div className="user-role">Candidat</div></div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-layout">
        <aside className="space-sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-label">Espace candidat</div>
            {navLink('dashboard', 'home', "Fil d'actualité")}
            {navLink('candidatures', 'fileLines', 'Mes candidatures')}
            {navLink('profil', 'user', 'Mon profil')}
            {navLink('cv', 'file', 'Mon CV')}
            {navLink('notifications', 'bell', 'Notifications', <span className="count-pill" style={badgeStyle}>{unread}</span>, markNotificationsRead)}
            <div className="sidebar-divider"></div>
            <a onClick={logout}><Icon name="logout" />Déconnexion</a>
          </nav>
        </aside>

        <main className="space-main">
          {tab === 'dashboard' && (
            <div className="space-tab active">
              {applyBanner && (
                <div className="success-banner">
                  <div className="icon-big"><Icon name="check" size="lg" /></div>
                  <div><strong>Candidature envoyée avec succès !</strong><span>{applyBanner}</span></div>
                </div>
              )}
              <div className="space-welcome"><h1>Bonjour {user?.name?.split(' ')[0]}</h1><p>Votre fil d’actualité rassemble vos candidatures et les opportunités à découvrir.</p></div>
              <div className="space-stats">
                <div className="space-stat"><div className="space-stat-icon blue"><Icon name="file" /></div><div><div className="space-stat-value">{userApplications.length}</div><div className="space-stat-label">Candidatures envoyées</div></div></div>
                <div className="space-stat"><div className="space-stat-icon orange"><Icon name="clock" /></div><div><div className="space-stat-value">{userApplications.filter((application) => ['recue', 'examen'].includes(application.statut)).length}</div><div className="space-stat-label">En attente de réponse</div></div></div>
                <div className="space-stat"><div className="space-stat-icon green"><Icon name="check" /></div><div><div className="space-stat-value">{userApplications.filter((application) => application.statut === 'acceptee').length}</div><div className="space-stat-label">Entretiens obtenus</div></div></div>
                <div className="space-stat"><div className="space-stat-icon purple"><Icon name="user" /></div><div><div className="space-stat-value">{profileCompletion}%</div><div className="space-stat-label">Profil complété</div></div></div>
              </div>
              {!user?.cv_name && (
                <div className="cv-required-banner">
                  <div><strong>Ajoutez votre CV pour postuler</strong><span>Un CV PDF est nécessaire pour envoyer une candidature et sera joint à chaque offre.</span></div>
                  <button className="btn btn-primary" onClick={() => setTab('cv')}>Déposer mon CV</button>
                </div>
              )}
              <div className="space-section">
                <div className="space-section-header"><h2>Mes candidatures récentes</h2><button className="btn btn-ghost" onClick={() => setTab('candidatures')}>Voir tout</button></div>
                <div><ApplicationList items={userApplications.slice(0, 3)} openOfferDetail={openOfferDetail} /></div>
              </div>
              <section className="space-section candidate-feed" aria-labelledby="feedOffersTitle">
                <div className="space-section-header">
                  <div><h2 id="feedOffersTitle">Offres à découvrir</h2><p>Les annonces récentes, classées selon vos compétences.</p></div>
                  <span className="feed-count">{feedOffers.length} offre{feedOffers.length > 1 ? 's' : ''}</span>
                </div>
                <label className="feed-search">
                  <Icon name="search" />
                  <input value={feedSearch} onChange={(event) => setFeedSearch(event.target.value)} placeholder="Rechercher un métier, une entreprise ou une ville" aria-label="Rechercher dans les offres" />
                </label>
                {feedOffers.length ? (
                  <div className="candidate-feed-grid">
                    {feedOffers.map(({ offer }) => (
                      <article className="candidate-feed-card" key={offer.id} onClick={() => openOfferDetail(offer.id)}>
                        <div className="offer-header">
                          <div className="company-logo" style={{ background: offer.couleur }}>{offer.initiales}</div>
                          <div><h3 className="offer-title">{offer.titre}</h3><p className="offer-company">{offer.entreprise}</p></div>
                        </div>
                        <div className="offer-meta"><span><Icon name="pin" size="sm" />{offer.localisation}</span><span>{offer.contrat}</span></div>
                        <p className="offer-desc">{offer.description}</p>
                        <span className="offer-link">Consulter l’offre<Icon name="arrowRight" size="sm" /></span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-space"><RawSvg name="searchMinus" /><h3>Aucune offre trouvée</h3><p>Essayez un autre mot-clé ou élargissez votre recherche.</p></div>
                )}
              </section>
            </div>
          )}

          {tab === 'candidatures' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Mes candidatures</h1><p>Suivez l'avancement de toutes vos candidatures.</p></div>
              <div className="space-section"><div><ApplicationList items={userApplications} openOfferDetail={openOfferDetail} /></div></div>
            </div>
          )}

          {tab === 'profil' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Mon profil</h1><p>Renseignez vos informations personnelles et professionnelles.</p></div>
              <div className="space-section">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Informations personnelles</h2>
                <div className="form-group"><label>Nom complet</label><input type="text" value={profile.name} onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))} className="no-icon" /></div>
                <div className="form-group"><label>Adresse e-mail</label><input type="email" value={user?.email || ''} className="no-icon" readOnly /></div>
                <div className="form-group"><label>Localisation</label><input type="text" value={profile.location} onChange={(e) => setProfile((current) => ({ ...current, location: e.target.value }))} className="no-icon" /></div>
                <div className="form-group"><label>Compétences</label><input type="text" value={profile.skills} onChange={(e) => setProfile((current) => ({ ...current, skills: e.target.value }))} className="no-icon" /></div>
                <div className="form-group"><label>Bio professionnelle</label><textarea className="no-icon" maxLength={1000} placeholder="Présentez votre parcours, vos objectifs et ce qui vous motive." value={profile.bio} onChange={(e) => setProfile((current) => ({ ...current, bio: e.target.value }))} /><span className="field-hint">{profile.bio.length}/1000 caractères</span></div>
                <button className="btn btn-primary" onClick={() => updateProfile({ name: profile.name, location: profile.location, skills: profile.skills.split(',').map((skill) => skill.trim()).filter(Boolean), bio: profile.bio })}><Icon name="check" size="sm" />Enregistrer</button>
              </div>
            </div>
          )}

          {tab === 'cv' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Mon CV</h1><p>Un CV PDF est obligatoire pour postuler. Chaque candidature conserve le CV envoyé au moment de l’envoi.</p></div>
              <div className="space-section">
                <div className="application-item" style={{ cursor: 'default' }}>
                  <div className="app-logo" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}><Icon name="file" size="lg" stroke="#fff" /></div>
                  <div className="app-info"><div className="app-title">{user?.cv_name || 'Aucun CV déposé'}</div><div className="app-company">{user?.cv_name ? 'CV enregistré sur votre profil' : 'Déposez un CV au format PDF.'}</div></div>
                  {user?.cv_name && <button className="btn btn-ghost" onClick={downloadCv}>Télécharger</button>}
                </div>
                <div style={{ marginTop: 20 }}>
                  <input ref={cvInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { if (e.target.files?.[0]) uploadCv(e.target.files[0]); e.target.value = '' }} />
                  <button className="btn btn-primary" onClick={() => cvInput.current?.click()}><Icon name="upload" size="sm" />{user?.cv_name ? 'Remplacer le CV' : 'Téléverser un CV'}</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Notifications</h1><p>Suivez les événements importants liés à vos candidatures.</p></div>
              <div className="space-section">
                <div>
                  {userNotifications.length === 0 ? (
                    <div className="empty-space"><RawSvg name="bell" /><h3>Aucune notification</h3><p>Vous serez informé des événements importants ici.</p></div>
                  ) : (
                    userNotifications.map((n, i) => (
                      <div className="application-item" key={i} style={{ cursor: 'default' }}>
                        <div className="app-logo" style={{ background: n.unread ? 'linear-gradient(135deg, #2563eb, #60a5fa)' : 'var(--bg-alt)' }}>
                          <Icon name="check" size="sm" stroke={n.unread ? '#fff' : 'var(--muted)'} />
                        </div>
                        <div className="app-info">
                          <div className="app-title">{n.titre}</div>
                          <div className="app-company" style={{ whiteSpace: 'normal' }}>{n.message}</div>
                          <div className="app-date"><Icon name="clock" size="xs" />{n.date}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
