# Fin Flow — Frontend Angular

Aplicación de gestión de finanzas personales construida con Angular 21. Se conecta al backend [fin-flow-api](https://github.com/yusney/fin-flow-api).

## Funcionalidades

- **Dashboard** — Vista general del balance, suscripciones activas, transacciones recientes y progreso de presupuestos en un layout de grilla bento responsive
- **Transacciones** — CRUD completo con filtros (búsqueda, tipo, categoría, rango de fechas), estadísticas de ingresos/gastos y filtros por mes actual por defecto
- **Presupuestos** — Seguimiento mensual de presupuestos por categoría con barras de progreso e indicadores de estado (en orden / advertencia / excedido)
- **Suscripciones** — CRUD completo con historial de ediciones (versionado SCD Tipo 2), toggle activo/inactivo y confirmación de eliminación. Soporta frecuencias mensual y anual
- **Configuración** — Vista del perfil de usuario y preferencias (moneda, formato de fecha, idioma, notificaciones)
- **Autenticación** — Login basado en JWT con cierre de sesión automático al expirar el token y protección de rutas mediante auth guard
- **Internacionalización** — Soporte completo en inglés y español via Transloco

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (componentes standalone, Signals) |
| Estilos | Tailwind CSS v4 |
| Reactivo | RxJS 7 |
| i18n | Transloco 8 |
| Testing | Vitest |
| Gestor de paquetes | pnpm |
| Lenguaje | TypeScript 5.9 |

## Requisitos Previos

- Node.js 20+
- pnpm 10+
- [fin-flow-api](https://github.com/yusney/fin-flow-api) corriendo en `http://localhost:3000`

## Cómo Empezar

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm start
```

Abrí `http://localhost:4200` en tu navegador.

## Scripts Disponibles

```bash
pnpm start          # Servidor de desarrollo
pnpm build          # Build de producción
pnpm test           # Correr tests con Vitest
pnpm watch          # Build en modo watch
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth guard
│   │   ├── interceptors/    # Interceptor HTTP para JWT
│   │   └── services/        # Servicios: Auth, Transacciones, Presupuestos, Suscripciones, Categorías
│   ├── features/
│   │   ├── dashboard/       # Página dashboard + shell de layout + sidebar
│   │   ├── transactions/    # Página CRUD de transacciones
│   │   ├── budgets/         # Página CRUD de presupuestos
│   │   ├── subscriptions/   # Página CRUD de suscripciones
│   │   ├── settings/        # Página de configuración
│   │   └── login/           # Página de login
│   └── shared/
│       └── models/          # Interfaces TypeScript (Transaction, Budget, Subscription, User)
├── environments/            # Configuración de URL de API por entorno
└── public/
    └── i18n/                # Archivos de traducción (en.json, es.json)
```

## Configuración de Entornos

| Archivo | Propósito |
|---------|-----------|
| `src/environments/environment.ts` | Desarrollo — API en `http://localhost:3000/api` |
| `src/environments/environment.prod.ts` | Producción — configurá tu URL de API acá |

## Notas de Arquitectura

- Todos los componentes son **standalone** — sin NgModules
- Manejo de estado via **Angular Signals** (`signal()`, `computed()`, `toSignal()`)
- Las rutas tienen **lazy loading** por feature
- El token JWT se inyecta automáticamente via interceptor HTTP
- Los tokens expirados disparan cierre de sesión automático y redirigen a `/login`
