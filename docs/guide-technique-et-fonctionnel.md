# Guide technique et fonctionnel

## 1. Vue d'ensemble

La plateforme sépare l'interface et l'API :

- **React 18** construit les pages et les espaces adaptés au rôle de l'utilisateur.
- **Vite 5** sert le frontend en développement et produit les fichiers statiques de production.
- **Laravel 12 / PHP 8.2** fournit l'API REST, valide les données et applique les autorisations côté serveur.
- **Laravel Sanctum** authentifie les appels API par jeton Bearer.
- **MySQL 8.4** conserve les comptes, offres, candidatures et notifications.
- **Docker Compose** démarre l'API et MySQL avec les volumes locaux.
- **CSS natif** dans `src/index.css` conserve l'identité visuelle existante, avec des règles adaptées aux petits écrans.

Cette architecture garde les contrôles d'accès dans l'API : masquer un bouton dans React améliore l'interface, mais ne remplace jamais l'autorisation serveur.

## 2. Parcours et pages

### Pages publiques

| Page / écran | Fichier | Fonction |
|---|---|---|
| Accueil public | `src/pages/Home.jsx` | Présentation, catégories, recherche et consultation des offres, inscription/connexion. Il n'est affiché qu'en l'absence de session authentifiée. |
| Connexion | `src/pages/Login.jsx` | Saisie de l'adresse e-mail et du mot de passe. |
| Inscription | `src/pages/Register.jsx` | Création d'un compte candidat ou employeur. |
| Détail d'une offre | `src/pages/OfferDetail.jsx` | Description, missions, profil recherché, offres similaires et action de candidature. |

### Espace candidat

| Section | Fichier | Fonction |
|---|---|---|
| Fil d'actualité | `src/pages/CandidateSpace.jsx` | Indicateurs personnels, candidatures récentes et annonces récentes classées selon les compétences. Recherche locale dans les offres reçues de l'API. |
| Mes candidatures | `src/pages/CandidateSpace.jsx` | Suivi des candidatures et de leur statut. |
| Mon profil | `src/pages/CandidateSpace.jsx` | Nom, adresse e-mail en lecture seule, localisation, compétences et bio professionnelle (1 000 caractères maximum). |
| Mon CV | `src/pages/CandidateSpace.jsx` | Dépôt, téléchargement ou remplacement d'un CV PDF. Le CV est obligatoire pour postuler. |
| Notifications | `src/pages/CandidateSpace.jsx` | Notifications de candidature et changements de statut. |

Le fil est personnalisé côté interface : les annonces contenant des compétences renseignées dans le profil sont classées en premier. La recherche porte sur les offres actives renvoyées par l'API.

### Espace employeur et administration

| Espace / section | Fichier | Fonction |
|---|---|---|
| Tableau de bord employeur | `src/pages/EmployerSpace.jsx` | Résumé des offres et candidatures reçues. |
| Mes offres | `src/pages/EmployerSpace.jsx` et `src/components/OfferModal.jsx` | Création, modification, activation et désactivation des offres. |
| Candidatures reçues | `src/pages/EmployerSpace.jsx` | Filtrage par offre, consultation du profil candidat associé, changement de statut et téléchargement du CV joint à la candidature. |
| Profil employeur | `src/pages/EmployerSpace.jsx` | Nom, secteur, localisation et description de l'entreprise. |
| Notifications employeur | `src/pages/EmployerSpace.jsx` | Alertes de nouvelles candidatures. |
| Administration | `src/pages/AdminSpace.jsx` | Statistiques, gestion des comptes et modération des offres. |

La navigation de chaque espace garde les actions propres au rôle. L'avatar n'est plus une action de déconnexion : la déconnexion est clairement nommée dans le menu latéral.

### Composants et état partagé

- `src/App.jsx` choisit l'écran, attend la vérification d'une session existante et ne rend pas les pages d'espace sans utilisateur authentifié.
- `src/context/AppContext.jsx` centralise la session, la navigation, les données chargées, les candidatures, les profils et les notifications.
- `src/services/api.js` ajoute le jeton aux requêtes, traite les erreurs, le téléversement et le téléchargement de fichiers.
- `src/components/OfferModal.jsx`, `Toast.jsx`, `Icon.jsx` et `LogoMark.jsx` regroupent les composants d'interface réutilisés.
- `src/index.css` contient les styles, dont la disposition responsive des espaces et du fil candidat.

## 3. Candidatures et CV

1. Le candidat dépose un PDF dans **Mon CV**.
2. Laravel vérifie le type de fichier PDF et limite sa taille à 5 Mo. Le fichier est enregistré sur le disque privé `local`, hors du répertoire public.
3. Le frontend bloque le parcours de candidature et propose directement le dépôt du CV si aucun CV n'est présent.
4. `POST /api/offers/{offer}/applications` refait cette vérification côté serveur, indépendamment de l'interface.
5. Au moment de postuler, l'API copie le CV vers un chemin privé propre à la candidature et enregistre son nom. Cette copie n'est pas remplacée si le candidat met ensuite son CV de profil à jour.
6. Le profil résumé (bio, localisation et compétences) est communiqué à l'employeur qui possède l'offre concernée. Le téléchargement est également limité à cet employeur.

La route de téléchargement d'une candidature est `GET /api/employer/applications/{application}/cv`. Les anciennes candidatures qui précèdent cette évolution peuvent encore utiliser le CV courant du candidat si leur copie historique n'existe pas.

## 4. API et accès

Toutes les routes protégées sont définies dans `backend/routes/api.php`. L'API est préfixée par `/api`.

| Domaine | Routes principales | Accès |
|---|---|---|
| Authentification | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | Inscription et connexion publiques; routes de session authentifiées. |
| Offres publiques | `GET /offers`, `GET /offers/{offer}` | Public; seules les offres actives sont consultables. |
| Profil/CV | `PATCH /profile`, `POST /profile/cv`, `GET /profile/cv` | Utilisateur authentifié; gestion du CV réservée au candidat. |
| Candidat | `GET /applications/mine`, `POST /offers/{offer}/applications` | Candidat. |
| Employeur | `/employer/offers`, `/employer/applications` et routes de gestion associées | Employeur; l'API vérifie la propriété de chaque offre/candidature. |
| Notifications | `GET /notifications`, `PATCH /notifications/{notification}/read` | Utilisateur authentifié; seules ses notifications sont modifiables. |
| Administration | `/admin/stats`, `/admin/users`, `/admin/offers` et routes de statut | Administrateur. |

Les contrôleurs JSON se trouvent dans `backend/app/Http/Controllers/Api/`. Les modèles Eloquent sont dans `backend/app/Models/`.

## 5. Sécurité et gestion de session

- Les mots de passe sont hachés par Laravel.
- Les jetons Sanctum expirent après sept jours (paramètre `sanctum.expiration`) et celui créé à la connexion porte la même durée.
- Le jeton du frontend est conservé dans `sessionStorage` plutôt que dans un stockage persistant; la connexion ne propose donc pas de case « se souvenir de moi ».
- La déconnexion révoque le jeton courant côté API et efface les données privées côté frontend. Une erreur réseau affiche un message tout en fermant la session locale.
- Les réponses `401` invalident la session de l'interface et renvoient vers l'accueil public.
- Le middleware `active` exige un compte actif sur toutes les routes authentifiées. Les rôles restent contrôlés par `EnsureUserRole`.
- La désactivation d'un compte par l'administration révoque ses jetons existants.
- L'inscription et la connexion ont des limites de débit dédiées, en plus de la limite générale API.
- Les CV sont privés; les noms de fichiers internes sont générés par Laravel. Les téléchargements passent par des routes authentifiées et contrôlées par propriétaire.
- Les validations de formulaire et les contrôles de propriété sont faits dans l'API. Les erreurs de validation restent explicites.

`sessionStorage` réduit la persistance du jeton, mais ne protège pas contre un script malveillant exécuté dans la page. Pour un déploiement réel, utiliser HTTPS, limiter les origines CORS, fournir des secrets uniques, définir `APP_DEBUG=false`, appliquer une politique CSP et maintenir les dépendances à jour. La configuration Docker de ce dépôt est destinée au développement local, pas à une production.

## 6. Données et évolution de base

- `users` : identité, rôle, profil professionnel, bio, chemin et nom du CV de profil.
- `offers` : annonce, employeur propriétaire et statut.
- `job_applications` : candidat, offre, statut et copie privée du CV soumis.
- `app_notifications` : notifications personnelles.
- `personal_access_tokens` : jetons Sanctum.

La migration `backend/database/migrations/2026_11_15_000001_add_bio_to_users_and_cv_snapshot_to_applications.php` ajoute la bio et les champs de copie du CV. Elle est lancée automatiquement par le démarrage Docker documenté dans le README; en environnement existant, exécuter `php artisan migrate` dans le conteneur API.

## 7. Démarrage et vérification

Depuis la racine du projet :

```powershell
npm ci
npm run build
docker compose up --build -d
```

Le frontend Vite est disponible sur `http://localhost:5173` et l'API sur `http://localhost:8000/api`. La compilation du frontend peut être vérifiée sans démarrer l'API. Les migrations Laravel s'exécutent au démarrage du conteneur API.
