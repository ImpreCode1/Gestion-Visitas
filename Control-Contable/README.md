# Control Contable

Módulo de Control Contable de Impresistem.

Stack: FastAPI + PostgreSQL + Next.js 15 + Docker Compose.

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (solo para desarrollo frontend)
- Python 3.12+ (solo para desarrollo backend)

## Arranque local

`ash
docker compose up --build
`

Esto levanta:

- **PostgreSQL 16** en localhost:5432
- **Backend API** en http://localhost:8000
- **Frontend** en http://localhost:3000

Documentación interactiva de la API: http://localhost:8000/docs

## Seed data

`ash
docker compose exec backend python -m app.seed.seed_data
`

## Migraciones Alembic

`ash
docker compose exec backend alembic upgrade head
`

## Estructura del proyecto

`
backend/
  app/
    core/        Configuración y conexión a BD
    models/      Modelos SQLAlchemy (15 dominios)
    schemas/     Esquemas Pydantic
    crud/        Lógica de acceso a datos
    api/v1/      Endpoints REST
    seed/        Datos de prueba
  alembic/       Migraciones
frontend/
  src/app/       Páginas Next.js 15 App Router
  components/    Componentes UI
docker-compose.yml
`

## Sync PRY-19

Los endpoints de sincronización con PRY-19 (/api/v1/sync-pry19/*) están definidos pero el cliente HTTP está mockeado. Se integrará Hydra IAM después de definir el mecanismo de auth (PRY-19).
