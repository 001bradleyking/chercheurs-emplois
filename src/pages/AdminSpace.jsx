import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Icon from '../components/Icon'
import LogoMark from '../components/LogoMark'

export default function AdminSpace() {
  const { showHome, logout, adminStats, adminUsers, adminOffers, updateAdminUserStatus, removeAdminOffer } = useApp()
  const [tab, setTab] = useState('dashboard')

  const navLink = (id, icon, label) => (
    <a className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon name={icon} />{label}</a>
  )

  return (
    <div className="space-view active" id="viewAdminSpace">
      <header className="space-topbar">
        <div className="container space-topbar-inner">
          <a className="logo" onClick={showHome}>
            <LogoMark id="lgAdmin" from="#1e293b" to="#475569" lens="#475569" />
            <span className="logo-text"><span className="brand-main">Chercheurs d'Emplois</span><span className="brand-sub">Administration</span></span>
          </a>
          <div className="space-actions">
            <div className="user-chip">
              <div className="user-avatar">AD</div>
              <div className="user-chip-label"><div className="user-name">Administrateur</div><div className="user-role">Supervision</div></div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-layout">
        <aside className="space-sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-label">Administration</div>
            {navLink('dashboard', 'grid', 'Tableau de bord')}
            {navLink('comptes', 'user', 'Gestion des comptes')}
            {navLink('moderation', 'shield', 'Modération des offres')}
            <div className="sidebar-divider"></div>
            <a onClick={logout}><Icon name="logout" />Déconnexion</a>
          </nav>
        </aside>

        <main className="space-main">
          {tab === 'dashboard' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Tableau de bord Administrateur</h1><p>Supervision technique et modération de la plateforme.</p></div>
              <div className="space-stats">
                <div className="space-stat"><div className="space-stat-icon blue"><Icon name="user" /></div><div><div className="space-stat-value">{adminStats.users}</div><div className="space-stat-label">Comptes inscrits</div></div></div>
                <div className="space-stat"><div className="space-stat-icon green"><Icon name="briefcase" /></div><div><div className="space-stat-value">{adminStats.offers}</div><div className="space-stat-label">Offres publiées</div></div></div>
                <div className="space-stat"><div className="space-stat-icon orange"><Icon name="info" /></div><div><div className="space-stat-value">{adminStats.reports}</div><div className="space-stat-label">Signalements</div></div></div>
              </div>
              <div className="space-section">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Activité récente</h2>
                <table className="admin-table">
                  <thead><tr><th>Date</th><th>Action</th><th>Détails</th></tr></thead>
                  <tbody>
                    {(adminStats.activity || []).map((activity, index) => (
                      <tr key={`${activity.action}-${index}`}><td>{activity.date}</td><td>{activity.action}</td><td>{activity.details}</td></tr>
                    ))}
                    {adminStats.activity?.length === 0 && <tr><td colSpan="3">Aucune activité récente.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'comptes' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Gestion des comptes</h1><p>Consultez et désactivez les comptes abusifs.</p></div>
              <div className="space-section">
                <table className="admin-table">
                  <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Action</th></tr></thead>
                  <tbody>
                    {adminUsers.map((account) => (
                      <tr key={account.id}>
                        <td>{account.nom}</td><td>{account.email}</td><td>{account.role}</td>
                        <td><span style={{ color: account.actif ? 'var(--success)' : 'var(--danger)' }}>{account.actif ? 'Actif' : 'Désactivé'}</span></td>
                        <td><button className={account.actif ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm'} onClick={() => updateAdminUserStatus(account.id, !account.actif)}>{account.actif ? 'Désactiver' : 'Réactiver'}</button></td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 && <tr><td colSpan="5">Aucun compte.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'moderation' && (
            <div className="space-tab active">
              <div className="space-welcome"><h1>Modération des offres</h1><p>Retirez les offres signalées ou manifestement inappropriées.</p></div>
              <div className="space-section">
                <table className="admin-table">
                  <thead><tr><th>Offre</th><th>Entreprise</th><th>Signalements</th><th>Action</th></tr></thead>
                  <tbody>
                    {adminOffers.map((offer) => (
                      <tr key={offer.id}>
                        <td>{offer.titre}</td><td>{offer.entreprise}</td><td>{offer.candidatures}</td>
                        <td><button className="btn btn-danger btn-sm" disabled={offer.statut === 'removed'} onClick={() => removeAdminOffer(offer.id)}>{offer.statut === 'removed' ? 'Retirée' : 'Retirer'}</button></td>
                      </tr>
                    ))}
                    {adminOffers.length === 0 && <tr><td colSpan="4">Aucune offre.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
