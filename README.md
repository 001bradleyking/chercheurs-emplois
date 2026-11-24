# Chercheurs d'Emplois

Application React/Vite reliée à une API REST Laravel 12, avec authentification par jetons Sanctum et base MySQL.

## Démarrage local (Windows)

Le frontend est servi sur `http://localhost:5173` et l'API sur `http://localhost:8000/api`. Choisissez l'une des deux façons de démarrer l'API.

### Sans Docker (PHP, Composer et SQLite)

Prérequis : PHP 8.2 ou ultérieur, Composer et Node.js. Dans le `php.ini` indiqué par `php --ini`, activez les extensions `mbstring`, `fileinfo`, `pdo_sqlite` et `sqlite3` (en retirant le `;` devant leurs lignes `extension=...`). Pour accepter les CV jusqu'à 5 Mo, réglez aussi `upload_max_filesize=8M` et `post_max_size=10M`, puis ouvrez un nouveau terminal.

Dans PowerShell, depuis la racine du dépôt :

1. Installer les dépendances et configurer la base :
   ```powershell
   Set-Location backend
   composer install
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   if (-not (Test-Path database\database.sqlite)) { New-Item -ItemType File -Path database\database.sqlite | Out-Null }
   php artisan migrate --seed
   ```
   Dans `backend/.env`, vérifiez que `DB_CONNECTION=sqlite` et `DB_DATABASE=database/database.sqlite`. Si `APP_KEY` est vide, générez-la avec `php artisan key:generate`.
2. Démarrer l'API dans ce terminal :
   ```powershell
   php artisan serve --host=127.0.0.1 --port=8000
   ```
3. Dans un second terminal à la racine du dépôt, démarrer le frontend :
   ```powershell
   npm ci
   Copy-Item .env.example .env.local
   npm run dev
   ```
   Si `.env.local` existe déjà, ne le recopiez pas. Il doit contenir `VITE_API_URL=http://localhost:8000/api`.

### Avec Docker

Prérequis : Docker Desktop et Node.js.

1. Démarrer l'API et MySQL : `docker compose up --build -d`
2. Installer les dépendances du frontend : `npm ci`
3. Créer le fichier local Vite : `Copy-Item .env.example .env.local`
4. Lancer le frontend : `npm run dev`

Au premier démarrage avec Docker, Laravel applique les migrations et charge six offres de démonstration. Les employeurs des offres initiales sont des comptes de démonstration non connectables ; créez un compte employeur depuis le site pour publier et gérer vos propres offres.

Pour créer l'administrateur, une fois l'API démarrée, exécuter `php artisan app:create-admin "Administrateur" admin@example.com` depuis `backend` sans Docker, ou `docker compose exec api php artisan app:create-admin "Administrateur" admin@example.com` avec Docker, puis saisir le mot de passe demandé.

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
