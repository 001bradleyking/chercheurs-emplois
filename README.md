# Chercheurs d'Emplois

Application React/Vite reliée à une API REST Laravel 12, avec authentification par jetons Sanctum et base MySQL.

## Démarrage local (Windows)

Prérequis : Docker Desktop et Node.js.

1. Démarrer l'API et MySQL : `docker compose up --build -d`
2. Installer les dépendances du frontend : `npm ci`
3. Créer le fichier local Vite : `Copy-Item .env.example .env.local`
4. Lancer le frontend : `npm run dev`

Le site est servi par Vite sur `http://localhost:5173` et l'API sur `http://localhost:8000/api`. Au premier démarrage, Laravel applique les migrations et charge six offres de démonstration. Les employeurs des offres initiales sont des comptes de démonstration non connectables ; créez un compte employeur depuis le site pour publier et gérer vos propres offres.

Pour créer l'administrateur, une fois l'API démarrée, exécuter `docker compose exec api php artisan app:create-admin "Administrateur" admin@example.com`, puis saisir le mot de passe demandé.

Les paramètres du frontend sont définis par `VITE_API_URL`. Les identifiants MySQL et la clé `APP_KEY` de Docker Compose sont réservés au développement local ; fournissez des valeurs uniques et désactivez `APP_DEBUG` avant tout déploiement.

## API

Les requêtes et réponses utilisent JSON (sauf téléversement/téléchargement du CV). Les réponses réussies exposent leurs résultats dans `data`; les erreurs de validation retournent les erreurs Laravel. Les routes protégées requièrent `Authorization: Bearer <token>`.

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/auth/register` | Public | Création candidat ou employeur |
| POST | `/auth/login` | Public | Connexion et création du jeton |
| GET | `/auth/me` | Jeton | Profil connecté |
| POST | `/auth/logout` | Jeton | Révocation du jeton |
| GET | `/offers`, `/offers/{id}` | Public | Recherche et détail |
| POST | `/offers/{id}/applications` | Jeton | Candidat |
| GET | `/applications/mine` | Jeton | Candidat |
| GET | `/employer/offers` | Jeton | Employeur |
| POST | `/employer/offers` | Jeton | Employeur |
| PATCH | `/employer/offers/{id}` | Jeton | Employeur propriétaire |
| PATCH | `/employer/offers/{id}/status` | Jeton | Employeur propriétaire |
| GET | `/employer/applications` | Jeton | Employeur |
| PATCH | `/employer/applications/{id}` | Jeton | Employeur propriétaire |
| PATCH | `/profile` | Jeton | Mise à jour du profil candidat ou employeur |
| POST/GET | `/profile/cv` | Jeton | Téléverser/télécharger son CV PDF (candidat) |
| GET | `/notifications` | Jeton | Utilisateur connecté |
| GET | `/admin/stats`, `/admin/users`, `/admin/offers` | Jeton | Administrateur |
| PATCH | `/admin/users/{id}/status`, `/admin/offers/{id}/status` | Jeton | Administrateur |

Une collection Bruno prête à l'emploi se trouve dans `bruno/` (environnement `Local`). Créez d'abord un compte, connectez-vous, puis Bruno conserve le jeton retourné dans son environnement.

## Documentation détaillée

Le [guide technique et fonctionnel](docs/guide-technique-et-fonctionnel.md) décrit les technologies, les pages et leurs responsabilités, le parcours CV/candidature, les routes API et les contrôles de session et d'accès.
