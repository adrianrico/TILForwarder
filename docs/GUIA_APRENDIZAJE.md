# Guía de aprendizaje: cómo construir desde cero un proyecto como TIL Forwarder

Este documento explica los conceptos clave y los pasos para reconstruir, desde cero, una
aplicación idéntica en estructura: un **frontend SPA (Single Page Application)** en React
que administra clientes, transportistas, rutas y maniobras de logística consumiendo una API REST.

---------------------------------------------------------------------

## 1. Qué es el proyecto

TIL Forwarder es el panel web de una empresa de transporte/forwarding. Permite:

- **Clientes**: alta/edición/baja de clientes.
- **Transportistas**: transportistas con sus operadores y económicos (unidades).
- **Rutas personalizadas**: plantillas de ruta con puntos y eventos/subeventos.
- **Maniobras**: servicios de transporte ligados a cliente + transportista + ruta.
- **Seguimiento**: actualizar ubicación/estatus/progreso de cada maniobra.
- **Dashboard**: métricas, maniobras recientes y mapa con GPS.

No tiene base de datos propia: es solo el **cliente**. Toda la información vive en un
backend (`maylob_backend`, API REST con MongoDB) al que se llama por HTTP.

## 2. Stack y por qué se eligió cada pieza

| Pieza | Para qué sirve | Concepto clave |
|---|---|---|
| **React 19** | Construir la interfaz con componentes | Componente = función que devuelve UI a partir de estado/props |
| **Vite** | Servidor de desarrollo y empaquetador | Módulos ES nativos, build rápido, variables `VITE_*` |
| **react-router-dom** | Navegación entre pantallas sin recargar | SPA: la URL cambia, el navegador no recarga la página |
| **TanStack Query** | Traer/cachear datos del servidor | Separa "estado del servidor" (query/mutation) del estado de UI |
| **Axios** | Cliente HTTP | Instancia única + interceptores |
| **Ant Design 6** | Componentes UI (tabla, formularios, modales) | Tema por tokens (`ConfigProvider`) |
| **dnd-kit** | Arrastrar y soltar (orden de puntos de ruta) | Sensores + lista ordenable |
| **Leaflet / react-leaflet** | Mapa | Capas de tiles + marcadores |
| **oxlint** | Linter muy rápido | Detecta errores de hooks y malas prácticas |
| **Vitest** | Pruebas unitarias | Funciones puras probadas con `describe/it/expect` |

## 3. Arquitectura (por qué está organizado así)

Se usa una **arquitectura por features (vertical slices)** con una capa compartida.
Cada funcionalidad de negocio vive junta; lo reutilizable va en `shared`.

```
src/
├─ main.jsx                  Punto de entrada: monta React + tema + idioma
├─ index.css                 Estilos globales
├─ app/                      "Composición": une todo
│  ├─ App.jsx                Proveedores + tabla de rutas (con carga diferida)
│  ├─ theme.js               Tokens de Ant Design (colores, radios)
│  ├─ queryClient.js         Configuración global de TanStack Query
│  └─ navigation.jsx         Menú de navegación (fuente única)
├─ features/                 Una carpeta por módulo de negocio
│  ├─ clientes/        pages/ + services/
│  ├─ transportistas/  pages/ + services/
│  ├─ rutas/           pages/ + services/
│  ├─ maniobras/       pages/ + services/
│  ├─ seguimiento/     pages/ + components/
│  └─ dashboard/       pages/ + components/
└─ shared/                   Código usado por varias features
   ├─ api/client.js          Instancia Axios segura (única puerta al backend)
   ├─ components/            GlobalLoader, ServerStatus, TILLogo, WaveBackground...
   ├─ layout/AppLayout.jsx   Barra superior, menú, drawer móvil, <Outlet/>
   └─ utils/                 toast, backendMessage, geo, validators, routeEvents
```

### Reglas de dependencia (lo más importante para mantenerlo limpio)

1. `app` puede importar de `features` y `shared`.
2. Una `feature` puede importar de `shared`. Las excepciones actuales son servicios de datos
   que varias pantallas necesitan (p. ej. `Maniobras` lee clientes/transportistas/rutas).
3. `shared` **nunca** importa de `features` ni de `app`. (Excepción histórica: `AppLayout`
   lee el menú de `app/navigation.jsx`.)
4. Las páginas **no** llaman a Axios directamente: usan `services/*`. Los servicios no
   conocen React. Así, si cambia un endpoint solo se toca un archivo.

### Capas dentro de una feature

```
Página (pages/X.jsx)  ──usa──▶  TanStack Query (useQuery/useMutation)
        │                              │
        │                              ▼
        │                      Servicio (services/xService.js)
        ▼                              │
 Componentes de UI (Ant Design)        ▼
                               Cliente HTTP (shared/api/client.js) ──▶ Backend REST
```

## 4. Conceptos clave explicados

### 4.1 SPA y enrutamiento
Solo existe un `index.html`. React Router decide qué componente pintar según la URL.
Como el servidor no conoce rutas como `/clientes`, se configura una **regla de reescritura**
(`render.yaml`) que devuelve `index.html` para cualquier ruta; luego el router del navegador
resuelve la pantalla.

`AppLayout` es una **ruta padre** con `<Outlet />`: dibuja la barra y, dentro, la página hija.

### 4.2 Carga diferida (code splitting)
`lazy(() => import('...'))` + `<Suspense>` hace que cada página sea un archivo JS aparte,
descargado solo cuando se visita. Reduce el peso inicial.

### 4.3 Estado del servidor vs. estado de UI
- **Estado del servidor** (clientes, rutas...): vive en el backend; se *consulta* y se
  *cachea*. Se maneja con `useQuery` (leer) y `useMutation` (crear/editar/borrar).
- **Estado de UI** (modal abierto, texto de búsqueda): `useState` local.

Flujo típico de una mutación:
1. `mutate(datos)` → llama al servicio.
2. `onSuccess` → muestra un `toast.success` y `invalidateQueries(['clientes'])`.
3. TanStack Query vuelve a pedir la lista y la tabla se actualiza sola.
4. `onError` → `toast.error` con el mensaje que mande el backend.

`meta: { label: '...' }` en cada query/mutation alimenta al `GlobalLoader`, que muestra
una pantalla de carga con ese texto mientras algo está en curso.

### 4.4 Edición en línea con "celdas sucias"
En `Clientes`, cada fila guarda una copia editable en `edits[id]`. Se compara contra el
dato original (`computeDirty`); si difiere, la fila se resalta y aparece el botón *Guardar*.
Detalle importante: el `useEffect` que sincroniza `edits` con los datos **no pisa** lo que el
usuario ya editó (solo inicializa filas nuevas).

### 4.5 Formularios y validación
Ant Design `Form` + `Form.Item rules={[...]}`. Las reglas reutilizables están en
`shared/utils/validators.js`. La validación del cliente es solo comodidad; **la validación
real debe estar siempre en el backend**.

### 4.6 Tema y diseño
`ConfigProvider` aplica un tema oscuro por *tokens* (`app/theme.js`). El efecto "vidrio"
usa `backdrop-filter: blur`. `WaveBackground` anima olas con CSS y parallax en scroll.

### 4.7 Variables de entorno
Vite expone al navegador solo variables que empiezan con `VITE_`.
- `.env.development` → `npm run dev` (backend local).
- `.env.production` → `npm run build` (backend de producción).
- **Nunca** pongas secretos aquí: todo lo `VITE_*` termina en el JavaScript público.

## 5. Seguridad (prioridad del proyecto)

Un frontend no puede "guardar secretos", pero sí debe evitar abrir huecos. Medidas aplicadas:

1. **URL de API solo desde entorno y HTTPS obligatorio en producción**
   (`shared/api/client.js` falla al arrancar si falta o no es `https://`).
2. **Timeout y límite de tamaño de respuesta** en Axios (evita cuelgues y respuestas abusivas).
3. **Sin cookies cross-site** (`withCredentials: false`).
4. **Errores normalizados**: la UI muestra mensajes controlados, nunca trazas internas.
5. **Content-Security-Policy y cabeceras** (`render.yaml`): `script-src 'self'` (bloquea XSS por
   scripts inyectados), `connect-src` limitado al backend, `frame-ancestors 'none'` y
   `X-Frame-Options: DENY` (anti-clickjacking), HSTS, `nosniff`, `Referrer-Policy`,
   `Permissions-Policy`.
6. **Sin CDN externos para scripts/íconos en tiempo de ejecución**: los íconos de Leaflet se
   empaquetan con Vite; así la CSP no necesita permitir recursos de terceros (salvo los
   tiles de OpenStreetMap, declarados explícitamente en `img-src`).
7. **Datos del backend tratados como no confiables**: React escapa texto por defecto (no hay
   `dangerouslySetInnerHTML`). `parseCoords` solo acepta `lat,lng` válido y en rango;
   `safeHttpUrl` bloquea `javascript:`/`data:` si alguna vez se pinta un enlace.
8. **Source maps desactivados** en build y **dependencias auditadas** (`npm audit` = 0).
   Se eliminó `playwright` (dependencia de desarrollo sin uso).
9. **`.env` locales ignorados por git** y `npm ci` en el despliegue (instalación reproducible).

Pendientes recomendados (requieren backend): autenticación (JWT en cookie `HttpOnly`),
autorización por rol, limitación de tasa (rate limiting) y validación estricta en servidor.

## 6. Paso a paso para crearlo desde cero

### Paso 1 — Preparar el entorno
- Instala Node.js ≥ 20 y Git.
- Crea el proyecto: `npm create vite@latest til-forwarder -- --template react` y entra a la carpeta.

### Paso 2 — Instalar dependencias
```
npm i antd @ant-design/icons @tanstack/react-query axios react-router-dom \
      leaflet react-leaflet @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm i -D oxlint
```

### Paso 3 — Alias `@` y seguridad de desarrollo (`vite.config.js`)
Configura `resolve.alias['@'] = src` para escribir `@/shared/...` en lugar de `../../..`.
Añade `build.sourcemap = false`.

### Paso 4 — Variables de entorno
Crea `.env.example` (documentado, sin datos reales), `.env.development`
(`VITE_API_URL=http://localhost:8080`) y `.env.production` (URL https del backend).

### Paso 5 — Capa compartida
1. `shared/api/client.js`: instancia Axios con baseURL desde env, timeout, interceptor.
2. `shared/utils/`: `toast.js` (notificaciones), `backendMessage.js`, `validators.js`, `geo.js`.
3. `shared/components/`: `TILLogo`, `GlobalLoader`, `ServerStatus`, `WaveBackground`.
4. `shared/layout/AppLayout.jsx`: `Layout` de Ant Design + `Menu` + `Drawer` móvil + `<Outlet />`.

### Paso 6 — Capa de aplicación
1. `app/theme.js` con `theme.darkAlgorithm` y tokens.
2. `app/queryClient.js`.
3. `app/navigation.jsx` con los ítems del menú.
4. `app/App.jsx` con `QueryClientProvider`, `BrowserRouter`, `Routes` y páginas con `lazy`.
5. `main.jsx` con `ConfigProvider` (tema + `es_ES`).

### Paso 7 — La primera feature: Clientes (plantilla para las demás)
1. `features/clientes/services/clientesService.js` → un objeto con funciones que llaman a `api`.
2. `features/clientes/pages/Clientes.jsx`:
   - `useQuery` para listar (`queryKey: ['clientes']`).
   - `useMutation` para crear/actualizar/borrar con `invalidateQueries`.
   - `Table` + `Input` en celdas + modal con `Form` para el alta.
3. Registra la ruta en `App.jsx` y el ítem en `navigation.jsx`.

### Paso 8 — Repetir el patrón
- **Transportistas**: igual, pero con sub-recursos (operadores/económicos) que reutilizan el
  mismo endpoint con `action: 'delete'`.
- **Rutas personalizadas**: lista ordenable con dnd-kit (`SortableContext`) y
  `Form.List` para eventos/subeventos (`shared/components/RouteEventsFields.jsx`).
- **Maniobras**: formulario que combina datos de clientes, transportistas y rutas;
  paginación del lado del servidor con `params`.
- **Seguimiento**: modal con `Steps`/`Timeline` para elegir ubicación/estatus.
- **Dashboard**: varias `useQuery` en paralelo, `Statistic` y `MapContainer` de Leaflet.

### Paso 9 — Calidad
- `npm run lint` (sin errores), `npm test` (pruebas), `npm run build` (debe compilar), `npm audit`.
- Revisa que no haya `console.log`, secretos ni HTML inyectado.

### Paso 10 — Despliegue
En Render (sitio estático): `buildCommand: npm ci && npm run build`, publicar `dist`,
regla de reescritura SPA y los encabezados de seguridad de `render.yaml`.
Recuerda actualizar `connect-src` si cambia el dominio del backend.

## 7. Comandos útiles

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo (backend local) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Probar el build localmente |
| `npm run lint` | Linter (oxlint) |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm audit` | Vulnerabilidades en dependencias |

## 8. Ejemplos completos y explicados

Cada ejemplo indica **qué problema resuelve**, **qué archivos se tocan**, el **código completo**
y **por qué está escrito así**. Los ejemplos 2 y 5 ya existen en el repositorio (puedes
ejecutarlos); los ejemplos 1, 3 y 4 son plantillas listas para copiar y adaptar.

---

### Ejemplo 1 — Agregar una feature nueva: "Facturas"

**Problema:** necesitas un módulo nuevo (listar, crear y borrar facturas) sin romper la
arquitectura. Siempre se siguen los mismos 4 pasos: *servicio → página → ruta → menú*.

**Archivos:**

```
src/features/facturas/services/facturasService.js   (nuevo)
src/features/facturas/pages/Facturas.jsx            (nuevo)
src/app/App.jsx                                     (+1 ruta)
src/app/navigation.jsx                              (+1 ítem de menú)
```

**Paso 1 — El servicio (solo HTTP, sin React):**

```js
// src/features/facturas/services/facturasService.js
import api from '@/shared/api/client'

export const facturasService = {
  /** Lista facturas. Respuesta esperada: { invoices_data: [...] } */
  readAll: () => api.get('/invoices/invoice/'),
  /** Crea una factura. */
  create:  (data) => api.post('/invoices/invoice/', data),
  /** Elimina una factura por id (el backend lo recibe en el cuerpo). */
  remove:  (invoice_id) => api.delete('/invoices/invoice/', { data: { invoice_id } }),
}
```

*Por qué:* la página nunca importa `axios`. Si mañana el endpoint cambia, editas solo este
archivo. `api` ya trae baseURL, timeout y manejo de errores seguros (ver sección 5).

**Paso 2 — La página (consulta + mutaciones + UI):**

```jsx
// src/features/facturas/pages/Facturas.jsx
import { useState } from 'react'
import { Typography, Button, Table, Modal, Form, Input, Popconfirm, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facturasService } from '../services/facturasService'
import { toast } from '@/shared/utils/toast'
import { requiredText } from '@/shared/utils/validators'

const { Title } = Typography

export default function Facturas() {
  const qc = useQueryClient()                       // para invalidar la caché tras escribir
  const [modalOpen, setModalOpen] = useState(false) // estado de UI: ¿modal visible?
  const [form] = Form.useForm()                     // instancia del formulario de Ant Design

  // LEER: la clave ['facturas'] identifica esta caché. `meta.label` alimenta al GlobalLoader.
  const { data = [], isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn:  () => facturasService.readAll().then(r => r.data?.invoices_data ?? []),
    meta:     { label: 'Cargando facturas...' },
    retry:    false,
  })

  // CREAR: al terminar bien → aviso, cerrar modal, limpiar form y refrescar la lista.
  const createMutation = useMutation({
    meta:       { label: 'Registrando factura...' },
    mutationFn: values => facturasService.create(values),
    onSuccess:  () => {
      toast.success('Factura registrada')
      setModalOpen(false)
      form.resetFields()
      qc.invalidateQueries({ queryKey: ['facturas'] })  // dispara un nuevo GET automático
    },
    onError: err => toast.error('Error al registrar la factura', err),
  })

  // BORRAR
  const deleteMutation = useMutation({
    meta:       { label: 'Eliminando factura...' },
    mutationFn: id => facturasService.remove(id),
    onSuccess:  () => {
      toast.success('Factura eliminada')
      qc.invalidateQueries({ queryKey: ['facturas'] })
    },
    onError: err => toast.error('Error al eliminar la factura', err),
  })

  const columns = [
    { title: 'Folio',   dataIndex: 'invoice_folio' },
    { title: 'Cliente', dataIndex: 'invoice_client' },
    { title: 'Monto',   dataIndex: 'invoice_amount', render: v => `$${Number(v).toFixed(2)}` },
    {
      title: 'Acciones',
      render: (_, r) => (
        <Popconfirm title="¿Eliminar esta factura?" onConfirm={() => deleteMutation.mutate(r.invoice_id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Eliminar</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Facturas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Nueva factura
        </Button>
      </div>

      {!isLoading && data.length === 0
        ? <Empty description="No hay facturas registradas" />
        : <Table columns={columns} dataSource={data} rowKey="invoice_id" loading={isLoading} />}

      <Modal
        title="Nueva factura"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}                       // dispara la validación + onFinish
        confirmLoading={createMutation.isPending}
        okText="Registrar"
      >
        <Form form={form} layout="vertical" onFinish={values => createMutation.mutate(values)}>
          <Form.Item name="invoice_folio" label="Folio" rules={requiredText('El folio')}>
            <Input />
          </Form.Item>
          <Form.Item name="invoice_client" label="Cliente" rules={requiredText('El cliente')}>
            <Input />
          </Form.Item>
          <Form.Item name="invoice_amount" label="Monto" rules={[{ required: true, message: 'Obligatorio' }]}>
            <Input type="number" min={0} step="0.01" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
```

*Qué debes notar:*
- `useQuery` **lee**; `useMutation` **escribe**. Tras escribir, `invalidateQueries` marca la
  caché como vieja y la lista se vuelve a pedir sola: no hay que actualizar el arreglo a mano.
- `onOk={() => form.submit()}` dispara primero las reglas de validación; solo si pasan se
  ejecuta `onFinish`.
- Los textos del usuario se muestran con JSX (`{valor}`), que **escapa** HTML: no hay XSS.

**Paso 3 — Registrar la ruta (`src/app/App.jsx`):**

```jsx
const Facturas = lazy(() => import('@/features/facturas/pages/Facturas'))
// ...dentro de <Route path="/" element={<AppLayout />}>
<Route path="facturas" element={<Facturas />} />
```

**Paso 4 — Agregar al menú (`src/app/navigation.jsx`):**

```jsx
import { FileTextOutlined } from '@ant-design/icons'
// ...dentro de menuItems
{ key: '/facturas', icon: <FileTextOutlined />, label: 'Facturas' },
```

La `key` del menú **debe coincidir** con la ruta (`/facturas`), porque `AppLayout` usa
`navigate(key)` y marca como activo el ítem cuyo `key` sea igual al `pathname`.

**Y la CSP?** No cambia: las peticiones van al mismo backend ya permitido en `connect-src`.

---

### Ejemplo 2 — Validación de RFC (ya implementado)

**Problema:** un formulario acepta cualquier texto en un campo con formato conocido.

**Dónde está:** `src/shared/utils/validators.js` (`optionalRfc`) y sus pruebas en
`src/shared/utils/__tests__/validators.test.js`.

```js
export const optionalRfc = [
  {
    pattern: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i,
    message: 'RFC inválido (12 o 13 caracteres)',
  },
]
```

**Cómo leer la expresión regular:**

| Parte | Significado |
|---|---|
| `^` ... `$` | Debe coincidir con **todo** el texto (evita "RFC válido + basura") |
| `[A-ZÑ&]{3,4}` | 3 letras (persona moral) o 4 (persona física); incluye Ñ y & |
| `\d{6}` | Fecha AAMMDD: 6 dígitos |
| `[A-Z0-9]{3}` | Homoclave: 3 caracteres alfanuméricos |
| `i` | Sin distinguir mayúsculas/minúsculas |

**Cómo usarlo en un formulario:**

```jsx
import { optionalRfc } from '@/shared/utils/validators'

<Form.Item name="client_rfc" label="RFC" rules={optionalRfc}>
  <Input placeholder="XAXX010101000" />
</Form.Item>
```

Una regla con solo `pattern` **no marca el campo como obligatorio**: si está vacío, Ant Design
no la evalúa (por eso se llama "opcional"). Para hacerlo obligatorio añade
`{ required: true, message: 'El RFC es obligatorio' }` antes.

> Seguridad: esta validación mejora la experiencia, pero **no protege nada**. El backend debe
> repetirla; un atacante puede enviar peticiones sin pasar por tu formulario.

---

### Ejemplo 3 — Autenticación (login + ruta protegida)

**Problema:** hoy cualquiera con la URL ve la aplicación. Se necesita iniciar sesión.

**Requisito del backend:** un endpoint `POST /auth/login` que reciba usuario/contraseña y
responda con la sesión. Hay dos diseños:

| Opción | Dónde vive la sesión | Riesgo principal |
|---|---|---|
| **A. Cookie `HttpOnly; Secure; SameSite=Strict`** (recomendada) | El navegador la guarda; JavaScript **no puede leerla** | CSRF (se mitiga con `SameSite` y token CSRF) |
| B. Token (JWT) en memoria | Una variable de JavaScript | Se pierde al recargar; un XSS podría leerla |

**Nunca** guardes el token en `localStorage`: cualquier XSS lo robaría.

**Opción A — archivos:**

```
src/features/auth/services/authService.js
src/features/auth/AuthContext.jsx
src/features/auth/pages/Login.jsx
src/features/auth/ProtectedRoute.jsx
```

*1. Cliente HTTP:* con cookies hay que permitir credenciales **solo hacia tu backend**.
En `shared/api/client.js` cambia `withCredentials: false` por `true` y ajusta en el backend
CORS (`Access-Control-Allow-Origin` = tu dominio exacto, `Access-Control-Allow-Credentials: true`).

*2. Servicio:*

```js
import api from '@/shared/api/client'

export const authService = {
  login:  (credentials) => api.post('/auth/login', credentials),
  logout: ()            => api.post('/auth/logout'),
  me:     ()            => api.get('/auth/me'),   // ¿hay sesión válida?
}
```

*3. Contexto (estado global de "quién soy"):*

```jsx
import { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from './services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const qc = useQueryClient()
  // El backend decide si la cookie es válida; el frontend solo pregunta.
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn:  () => authService.me().then(r => r.data).catch(() => null),
    retry: false,
  })

  const login = async (credentials) => {
    await authService.login(credentials)
    await qc.invalidateQueries({ queryKey: ['me'] })
  }
  const logout = async () => {
    await authService.logout()
    qc.clear()                       // borra TODA la caché: no queda info del usuario anterior
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
```

*4. Ruta protegida:*

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null                         // aún comprobando la sesión
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
```

*5. Conectarlo en `App.jsx`:*

```jsx
<AuthProvider>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>               {/* todo lo de adentro exige sesión */}
      <Route path="/" element={<AppLayout />}>
        {/* ...rutas actuales... */}
      </Route>
    </Route>
  </Routes>
</AuthProvider>
```

*6. Sesión expirada (401):* en el interceptor de `client.js` detecta `401` y redirige:

```js
if (error.response?.status === 401) {
  window.location.assign('/login')
}
```

**Lo esencial:** ocultar pantallas en el frontend es **comodidad**, no seguridad. La
autorización real (¿este usuario puede borrar esto?) se comprueba en cada endpoint del backend.

---

### Ejemplo 4 — Dividir un componente gigante (técnica paso a paso)

**Problema:** `RutasSeguimiento.jsx` tiene ~1000 líneas. Es difícil de leer, de probar y de
revisar. Se divide **sin cambiar el comportamiento**, en pasos pequeños verificables.

**Regla de oro:** después de cada paso corre `npm run build` y prueba la pantalla. Nunca
mezcles "mover código" con "cambiar lógica".

**Paso 1 — Extrae utilidades puras** (sin hooks ni JSX) a un archivo propio.
Ejemplo con `parseProgress` y `isCancelled` (hoy dentro de `Dashboard.jsx`):

```js
// src/features/maniobras/utils/status.js
export const parseProgress = (m) => parseInt(m.man_progress, 10) || 0
export const isCancelled   = (m) => (m.man_current_status ?? '').toUpperCase().includes('CANCEL')
```

En la página: `import { parseProgress, isCancelled } from '@/features/maniobras/utils/status'`.
Ventaja inmediata: ahora son **fáciles de probar** (ver ejemplo 5).

**Paso 2 — Extrae un hook** cuando varias líneas de `useQuery`/`useState` forman una unidad.
Ejemplo: las consultas que la página necesita para poblar listas.

```js
// src/features/seguimiento/hooks/useSeguimientoLookups.js
import { useQuery } from '@tanstack/react-query'
import { clientesService } from '@/features/clientes/services/clientesService'
import { transportistasService } from '@/features/transportistas/services/transportistasService'
import { rutasService } from '@/features/rutas/services/rutasService'

/** Carga clientes, transportistas y rutas (catálogos de apoyo) y los devuelve ya "aplanados". */
export function useSeguimientoLookups() {
  const clientes = useQuery({
    queryKey: ['clientes'],
    queryFn:  () => clientesService.readAll().then(r => r.data?.clients_data ?? []),
    meta:     { label: 'Cargando clientes...' },
    retry: false,
  })
  const transportistas = useQuery({
    queryKey: ['transportistas'],
    queryFn:  () => transportistasService.readAll().then(r => r.data?.transporters_data ?? []),
    meta:     { label: 'Cargando transportistas...' },
    retry: false,
  })
  const rutas = useQuery({
    queryKey: ['rutas-personalizadas'],
    queryFn:  () => rutasService.readAll().then(r => r.data?.routes_data ?? []),
    meta:     { label: 'Cargando rutas...' },
    retry: false,
  })
  return {
    clientes:       clientes.data ?? [],
    transportistas: transportistas.data ?? [],
    rutas:          rutas.data ?? [],
    isLoading:      clientes.isLoading || transportistas.isLoading || rutas.isLoading,
  }
}
```

> Nota: reutilizar las **mismas `queryKey`** que otras pantallas (`['clientes']`) hace que
> TanStack Query comparta la caché: no se vuelve a pedir lo que ya se tiene.
> Verifica las claves reales en la página antes de moverlas.

**Paso 3 — Extrae subcomponentes de UI** (un modal, un formulario, una tarjeta):
cópialo a `features/seguimiento/components/`, pásale por *props* lo que usaba del padre
(datos y callbacks) y reemplaza el bloque original por `<MiComponente ... />`.

```jsx
// Antes (dentro de la página): 150 líneas de <Modal> + <Form> ...
// Después:
<ManeuverFormModal
  open={modalOpen}
  record={editingRecord}
  onClose={() => setModalOpen(false)}
  onSubmit={values => saveMutation.mutate(values)}
  saving={saveMutation.isPending}
/>
```

**Paso 4 — Un solo cambio de responsabilidad por archivo.** Meta razonable: la página
queda en ~150–250 líneas y solo *orquesta* (hooks + estado de UI + composición).

**Ya hay un ejemplo real:** `useIsDesktop` vive hoy dentro de `LocationStatusTimeline.jsx`.
Si otro componente lo necesita, muévelo a `src/shared/hooks/useIsDesktop.js` y expórtalo; así
nace una capa `shared/hooks` sin duplicar código.

**Cómo saber que no rompiste nada:** `npm run lint`, `npm run build`, `npm test`, y probar a
mano el flujo (crear → editar → guardar → borrar).

---

### Ejemplo 5 — Pruebas automáticas con Vitest (ya implementado)

**Problema:** un cambio futuro podría romper funciones críticas (validar coordenadas, filtrar
eventos). Las pruebas lo detectan en segundos.

**Dónde están:** `src/shared/utils/__tests__/` (`geo.test.js`, `routeEvents.test.js`,
`validators.test.js`). Se ejecutan con:

```
npm test
```

**Anatomía de una prueba** (`geo.test.js`):

```js
import { describe, it, expect } from 'vitest'
import { parseCoords } from '../geo'

describe('parseCoords', () => {                       // agrupa pruebas de una función
  it('acepta "lat,lng" válido', () => {               // una expectativa concreta
    expect(parseCoords('19.43,-99.13')).toEqual([19.43, -99.13])
  })
  it('rechaza valores fuera de rango', () => {
    expect(parseCoords('91,0')).toBeNull()            // latitud > 90 no existe
  })
})
```

**Patrón AAA:** *Arrange* (preparar el dato) → *Act* (llamar la función) → *Assert*
(`expect(...)`). Prueba siempre el caso feliz **y** los casos hostiles (null, texto raro,
`javascript:`), porque ahí nacen los fallos de seguridad.

**Qué probar primero:** funciones puras (`utils/`). Son rápidas, no necesitan navegador y
son las que más protegen la lógica de negocio.

**Siguiente nivel — probar un componente** (requiere `npm i -D @testing-library/react jsdom`
y `test: { environment: 'jsdom' }` en `vite.config.js`):

```jsx
import { render, screen } from '@testing-library/react'
import StatCard from '@/features/dashboard/components/StatCard'

it('muestra el título y el valor', () => {
  render(<StatCard title="Clientes" value={12} />)
  expect(screen.getByText('Clientes')).toBeTruthy()
})
```

**Buena práctica:** corre `npm test` en el pipeline de despliegue antes de `npm run build`
para que un código roto nunca llegue a producción.

## 9. Errores comunes y cómo evitarlos

- **Duplicados al editar**: el backend decide crear/actualizar según `client_id`; envía siempre ese id.
- **Perder lo que el usuario está escribiendo** por un refetch: no sobrescribas estado local al llegar datos nuevos.
- **Variables `VITE_*` con secretos**: son públicas. Nunca las uses para claves.
- **Olvidar la regla SPA** en el hosting: al recargar `/clientes` daría 404.
- **CSP muy estricta rompe la app**: si añades un servicio externo (mapa, fuentes, analítica), agrégalo a la CSP.
