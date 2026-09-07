# Déploiement — PAGO

Architecture : `Internet → kbbot-caddy (HTTPS auto, déjà en place sur ce VPS) → frontend (nginx) → backend (FastAPI) → db (Postgres)`.

PAGO ne fait **pas** tourner son propre Caddy : ce VPS a déjà un conteneur `kbbot-caddy` qui sert plusieurs sites (kbot, oser-bf.org, logo-services.com, my-love...) sur les ports 80/443. PAGO rejoint ce Caddy via le réseau Docker `kbbot_backend` sur lequel il vit déjà — voir section 3. Caddy continue de gérer le certificat TLS automatiquement (Let's Encrypt) pour `pago.logo-services.com` comme pour les autres sites.

Chaque push sur `main` reconstruit les images, les pousse sur GitHub Container Registry (GHCR), puis se connecte en SSH au VPS pour tirer les nouvelles images et redémarrer (voir [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)).

## 1. Prérequis sur le VPS

- Docker + le plugin Docker Compose installés (`docker compose version` doit fonctionner).
- Le conteneur `kbbot-caddy` tourne déjà sur ce VPS (ports 80/443), sur le réseau Docker `kbbot_backend`.
- Le DNS de `pago.logo-services.com` pointe vers l'IP du VPS — confirmé : `51.178.251.73`.

## 2. Mise en place initiale (une seule fois)

```bash
# Sur le VPS, dans le dossier où l'app doit vivre (ex: /opt/pago)
git clone https://github.com/Laurentzo1992/pago.git /opt/pago
cd /opt/pago

cp .env.prod.example .env.prod
nano .env.prod   # renseigner POSTGRES_PASSWORD, SECRET_KEY, GHCR_OWNER, CORS_ORIGINS
                  # DOMAIN et CADDY_NETWORK ont déjà les bonnes valeurs par défaut

# Générer un hash bcrypt pour le mot de passe admin (ne PAS réutiliser celui de dev)
python3 -c "import bcrypt; print(bcrypt.hashpw(b'un-mot-de-passe-fort', bcrypt.gensalt()).decode())"
# Coller le résultat dans ADMIN_PASSWORD_HASH de .env.prod, en doublant chaque $
# (ex: $2b$12$abc... -> $$2b$$12$$abc...) sinon docker compose l'interprète comme une variable.
```

**Avant le premier `docker compose up -d`**, lire la section 3 ci-dessous. `docker-compose.prod.yml` référence le réseau Docker externe `kbbot_backend` (déjà existant sur ce VPS) : si `CADDY_NETWORK` dans `.env.prod` ne correspond pas exactement à ce nom, `up -d` échoue avec `network ... declared as external, but could not be found`.

Une fois la section 3 faite :

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Vérifier que tout démarre : `docker compose -f docker-compose.prod.yml ps` (tous les services `healthy` après ~30s).

Peupler les données (communes, types, infrastructures) depuis les fichiers Excel/shapefiles déjà commités dans `backend/scripts/data/` :

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend python -m scripts.migrate_data
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend python -m scripts.convert_shapefiles
```

## 3. Brancher PAGO sur le Caddy existant

Ce VPS a déjà un conteneur `kbbot-caddy` qui sert plusieurs sites (kbot, oser-bf.org, logo-services.com, my-love...) sur les ports 80/443 — PAGO ne peut pas en démarrer un second sur les mêmes ports. `kbbot-caddy` vit déjà sur le réseau Docker `kbbot_backend` (confirmé via `docker inspect kbbot-caddy --format "{{json .NetworkSettings.Networks}}"`) : PAGO rejoint ce réseau existant plutôt que d'en créer un nouveau. **Aucune modification du docker-compose de kbot n'est nécessaire** — `kbbot_backend` existe déjà et `kbbot-caddy` y est déjà.

⚠️ Le nom `pago-frontend` (pas `frontend`) est utilisé exprès dans le bloc Caddy ci-dessous : sur `kbbot_backend`, `frontend` résout déjà vers le service `frontend` de kbot — un bare `frontend` pour PAGO entrerait en collision.

**a) Ajouter le bloc de site pour PAGO** dans le Caddyfile déjà monté dans `kbbot-caddy`, comme un NOUVEAU bloc de site au même niveau que les blocs existants (`kbot.logo-services.com { ... }`, `oser-bf.org, www.oser-bf.org { ... }`, etc. — ne rien imbriquer dedans) — le contenu exact est dans [Caddyfile.snippet](Caddyfile.snippet) à la racine de ce repo :

```
pago.logo-services.com {
	reverse_proxy pago-frontend:80
}
```

**b) Recharger Caddy** (zéro coupure pour les autres sites) :

```bash
docker exec kbbot-caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy demandera automatiquement un certificat Let's Encrypt pour `pago.logo-services.com` au premier accès HTTPS, maintenant que son DNS pointe vers ce VPS.

**c) Vérifier que `.env.prod` a bien `CADDY_NETWORK=kbbot_backend`** (valeur déjà par défaut dans `.env.prod.example`) avant l'`up -d` de la section 2 — sinon PAGO tentera de rejoindre un réseau `edge` qui n'existe pas et `up -d` échouera.

## 4. Connecter GitHub Actions au VPS

Créer une paire de clés SSH **dédiée au déploiement** (pas votre clé personnelle) :

```bash
ssh-keygen -t ed25519 -f ./pago_deploy_key -N ""
# Copier la clé PUBLIQUE sur le VPS :
ssh-copy-id -i ./pago_deploy_key.pub <user>@<vps>
# (ou coller le contenu de pago_deploy_key.pub dans ~/.ssh/authorized_keys du VPS manuellement)
```

Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**, créer :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | IP ou nom de domaine du VPS |
| `VPS_USER` | utilisateur SSH (ex: `deploy`, `ubuntu`, `root`) |
| `VPS_SSH_KEY` | contenu de la clé **privée** `pago_deploy_key` (pas `.pub`) |
| `VPS_SSH_PORT` | port SSH si différent de 22 (optionnel) |
| `VPS_DEPLOY_PATH` | chemin absolu du clone sur le VPS (ex: `/opt/pago`) |

Supprimez ensuite `pago_deploy_key` / `pago_deploy_key.pub` de votre machine locale une fois le secret enregistré.

## 5. Rendre les images GHCR accessibles au VPS

Après le premier push sur `main`, le workflow publie `ghcr.io/<owner>/pago-backend` et `pago-frontend`. Si le dépôt GitHub est public, les packages GHCR le sont généralement aussi ; sinon (ou en cas de doute) : sur GitHub → onglet **Packages** du compte/organisation → ouvrir chaque package → **Package settings** → **Change visibility** → **Public**. Un package privé empêcherait le VPS de faire `docker compose pull` sans authentification supplémentaire.

## 6. Fonctionnement au quotidien

- Chaque push sur `main` déclenche automatiquement : build → push GHCR → déploiement SSH. Suivre la progression dans l'onglet **Actions** du repo.
- Les migrations de schéma (Alembic) s'appliquent automatiquement au démarrage du conteneur `backend` (voir [backend/Dockerfile](backend/Dockerfile)). Le script de peuplement de données (`migrate_data.py`) n'est **pas** relancé automatiquement — il est idempotent, à relancer manuellement seulement si les fichiers sources changent.
- Revenir en arrière : sur le VPS, `docker compose -f docker-compose.prod.yml --env-file .env.prod pull` ne permet de choisir un tag précis qu'en éditant temporairement `docker-compose.prod.yml` (remplacer `:latest` par `:<sha du commit précédent>` pour `backend`/`frontend`), puis `up -d`.
- Le bloc de site Caddy (section 3) n'est à faire qu'une fois — un `git pull` + redéploiement de PAGO n'y touche pas.

## 7. Sauvegardes

À faire régulièrement (cron sur le VPS) :
- `docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db pg_dump -U pago pago > backup-$(date +%F).sql`
- Le dossier `backend/media/` (fichiers uploadés via l'admin : guides, images de légende).
- Le volume de données de `kbbot-caddy` (certificats TLS, y compris celui de `pago.logo-services.com` désormais) — sans lui, Caddy redemande un certificat, ce qui est rate-limité par Let's Encrypt.
