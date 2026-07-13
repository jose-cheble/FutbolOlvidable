# Futbol Olvidable

App para equipos amateur: grupos aislados, cancha interactiva, votaciones y rankings por grupo.

**Stack:** Angular 17 · NestJS · PostgreSQL 16 · Docker Compose · nginx · certbot (prod)

---

## Arranque rápido (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Abrí http://localhost

| Entorno | Comando |
|---------|---------|
| Dev | `docker compose up --build` |
| Prod (SSL) | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build` |

### Credenciales semilla

| Campo | Valor |
|-------|-------|
| Email | `admin@futbol.local` |
| Password | `Admin123!` |
| Nombre | Admin Demo |

Se crean automáticamente en desarrollo (`RUN_SEED=true`) junto con el grupo demo **Los Amigos FC**.

---

## Desarrollo local (sin Docker completo)

### PostgreSQL

Necesitás Postgres en `localhost:5432` (o solo el servicio `postgres` de Compose):

```bash
docker compose up postgres -d
```

### Backend

```bash
cd backend
cp ../.env.example .env   # o usá el .env de la raíz vía DATABASE_URL=localhost
npm install
npm run start:dev
```

API en http://localhost:3000

Seed manual: `npm run seed`

### Frontend

```bash
cd frontend
npm install
npm start
```

App en http://localhost:4200 (proxy `/api` → `:3000`)

---

## PostgreSQL (herramientas externas)

En **dev**, el puerto `5432` está mapeado al host:

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Puerto | `5432` |
| Database | `futbol_olvidable` |
| User | `postgres` |
| Password | valor de `.env` (`POSTGRES_PASSWORD`) |

> En producción no expongas el puerto de Postgres.

---

## Arquitectura

```
Browser → nginx (:80/:443)
            ├─ /          → Angular SPA
            ├─ /api/      → NestJS (:3000)
            └─ /uploads/  → volumen de fotos WebP
```

- Cada **grupo** es un universo: jugadores, votos y rankings no se mezclan entre grupos.
- Un mismo usuario puede tener un **Player** distinto (y puntaje distinto) en cada grupo.
- Fotos: upload → `sharp` → WebP (resize + quality configurable).

---

## Flujo de un partido

1. **BORRADOR** — armar equipos y colocar pins en la cancha  
2. **EN_VOTACION** — miembros votan (1–100) + MVP (batch inmutable)  
3. **CERRADO** — manual o automático cuando todos los miembros votaron  

---

## SSL / producción

Dominio: `futbol-olvidable.archsys.com`

- Overlay `docker-compose.prod.yml` levanta **certbot**
- Si `ENABLE_SSL != true`, certbot sale sin error
- Renovación: re-ejecutar el servicio certbot o cron con el mismo entrypoint

Variables relevantes en `.env`:

```
ENABLE_SSL=true
DOMAIN=futbol-olvidable.archsys.com
CERTBOT_EMAIL=tu@email.com
JWT_SECRET=<secreto-largo>
```

Para activar el bloque HTTPS de nginx, copiá el template:

```bash
cp nginx/conf.d/futbol-olvidable.archsys.com.conf.template \
   nginx/conf.d/futbol-olvidable.archsys.com.conf
# y deshabilitá/ajustá conf.d/dev.conf en la imagen de prod
```

---

## Estructura

```
FutbolOlvidable/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── nginx/
├── backend/          # NestJS + TypeORM
├── frontend/         # Angular SPA
└── PLAN.md
```

---

## OAuth Google

Preparado (stub + campos `auth_provider` / `provider_id`) pero **no implementado**. Variables `GOOGLE_*` comentadas en `.env.example`.
