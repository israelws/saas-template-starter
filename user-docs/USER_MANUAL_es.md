# Manual del Usuario - Plataforma SAAS

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Organizaciones](#gestión-de-organizaciones)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Gestión de Roles](#gestión-de-roles)
6. [Gestión de Políticas](#gestión-de-políticas)
7. [Gestión de Atributos](#gestión-de-atributos)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Solución de Problemas](#solución-de-problemas)

---

## 1. Introducción

Bienvenido al Manual del Usuario de la Plataforma SAAS. Esta guía completa le ayudará a comprender y utilizar eficazmente el sistema avanzado de gestión de permisos basado en Control de Acceso Basado en Atributos (Attribute-Based Access Control - ABAC).

### Conceptos Clave

- **Organizaciones (Organizations)**: Estructuras jerárquicas que representan empresas, divisiones, departamentos y equipos
- **Usuarios (Users)**: Cuentas individuales que pueden pertenecer a múltiples organizaciones
- **Roles (Roles)**: Funciones laborales o puestos (p.ej., Gerente, Auditor)
- **Políticas (Policies)**: Reglas que definen qué acciones pueden realizar los usuarios
- **Atributos (Attributes)**: Propiedades dinámicas utilizadas en la evaluación de políticas

---

## 2. Primeros Pasos

### Primer Inicio de Sesión

1. Navegue a la página de inicio de sesión de la plataforma
2. Ingrese sus credenciales
3. En el primer inicio de sesión, será dirigido al panel de control
4. Seleccione su organización activa desde la navegación superior

### Vista General del Panel

El panel principal proporciona:
- Selector de organización (arriba a la derecha)
- Barra lateral de navegación con secciones clave
- Estadísticas rápidas y actividades recientes
- Botones de acción para tareas comunes

---

## 3. Gestión de Organizaciones

### Comprendiendo la Jerarquía Organizacional

Las organizaciones siguen una estructura jerárquica estricta:

```
Empresa (Company)
├── División (Division)
│   ├── Departamento (Department)
│   │   └── Equipo (Team)
├── Agencia de Seguros (Insurance Agency)
│   └── Sucursal de Seguros (Insurance Branch)
```

### Creación de Organizaciones

#### Ejemplo 1: Crear una Empresa

1. Navegue a **Panel > Organizaciones**
2. Haga clic en **"Crear Organización"**
3. Complete el formulario:
   - **Nombre (Name)**: "Corporación Acme"
   - **Tipo (Type)**: Empresa
   - **Padre (Parent)**: (dejar vacío para empresas raíz)
   - **Descripción (Description)**: "Entidad corporativa principal"
4. Haga clic en **"Crear"**

#### Ejemplo 2: Crear una División

1. Desde la página de organizaciones, haga clic en **"Crear Organización"**
2. Complete:
   - **Nombre**: "Operaciones América del Norte"
   - **Tipo**: División
   - **Padre**: Seleccione "Corporación Acme" (debe ser una Empresa)
   - **Descripción**: "Operaciones regionales de NA"
3. Haga clic en **"Crear"**

#### Ejemplo 3: Crear un Departamento

1. Crear nueva organización
2. Complete:
   - **Nombre**: "Departamento de Ventas"
   - **Tipo**: Departamento
   - **Padre**: Seleccione "Operaciones América del Norte" (debe ser una División)
   - **Descripción**: "Equipo de ventas para la región NA"

### Gestión de Organizaciones

#### Ver Jerarquía Organizacional

1. Vaya a **Panel > Organizaciones**
2. Use la vista de árbol para ver la estructura jerárquica
3. Haga clic en cualquier organización para ver detalles
4. Use los botones expandir/contraer para navegar

#### Editar Organizaciones

1. Haga clic en una organización en el árbol
2. Seleccione **"Editar"** del menú de acciones
3. Actualice la información (Nota: el tipo de organización no se puede cambiar)
4. Guarde los cambios

#### Restricciones de Organización

- **Empresas** solo pueden tener Divisiones o Agencias de Seguros como hijos
- **Divisiones** solo pueden tener Departamentos como hijos
- **Departamentos** solo pueden tener Equipos como hijos
- **Equipos** no pueden tener organizaciones hijas
- **Agencias de Seguros** solo pueden tener Sucursales de Seguros como hijos

---

## 4. Gestión de Usuarios

### Creación de Usuarios

#### Ejemplo 1: Crear un Usuario Gerente

1. Navegue a **Panel > Usuarios**
2. Haga clic en **"Crear Usuario"**
3. Complete:
   - **Correo**: manager@acme.com
   - **Nombre**: Juan
   - **Apellido**: García
   - **Organizaciones**: Seleccione "Departamento de Ventas"
   - **Roles**: Seleccione "Gerente"
4. Haga clic en **"Crear"**

#### Ejemplo 2: Crear un Usuario Multi-Organización

1. Crear nuevo usuario
2. Complete información básica
3. En sección Organizaciones:
   - Añada "Operaciones América del Norte" con rol "Gerente"
   - Añada "Operaciones Europa" con rol "Auditor"
4. Este usuario puede cambiar entre organizaciones

### Gestión de Membresías de Usuario

#### Añadir Membresía de Organización

1. Vaya a la página de detalles del usuario
2. Haga clic en **"Añadir Organización"**
3. Seleccione organización y rol
4. Guarde cambios

#### Eliminar Membresía de Organización

1. Vaya a la página de detalles del usuario
2. Encuentre la membresía de organización
3. Haga clic en el icono de eliminar
4. Confirme eliminación

### Gestión del Estado del Usuario

- **Activo (Active)**: El usuario puede iniciar sesión y acceder a recursos
- **Inactivo (Inactive)**: El usuario no puede iniciar sesión
- **Suspendido (Suspended)**: Restricción temporal, puede ser reactivado

---

## 5. Gestión de Roles

### Comprendiendo los Roles

Los roles definen funciones laborales, NO permisos. Ejemplos:
- **Admin (Admin)**: Administrador de organización
- **Gerente (Manager)**: Gerente de departamento o equipo
- **Auditor (Auditor)**: Acceso de solo lectura para cumplimiento
- **Usuario (User)**: Usuario estándar

### Creación de Roles Personalizados

#### Ejemplo: Crear un Rol de Gerente Regional

1. Navegue a **Panel > Roles**
2. Haga clic en **"Crear Rol"**
3. Complete:
   - **Nombre del Rol**: regional_manager (minúsculas, guiones bajos)
   - **Nombre Mostrado**: Gerente Regional
   - **Descripción**: "Gestiona múltiples departamentos en una región"
   - **Estado**: Activo
4. Haga clic en **"Crear"**

### Notas Importantes sobre Roles

- Los roles NO tienen permisos adjuntos
- Los permisos se otorgan a través de políticas
- Los roles del sistema (Admin, Gerente, Usuario) no se pueden editar
- Se pueden crear roles personalizados para necesidades específicas

---

## 6. Gestión de Políticas

### Comprendiendo las Políticas

Las políticas definen QUIÉN puede hacer QUÉ en QUÉ recursos bajo QUÉ condiciones.

### Componentes de Políticas

1. **Sujetos (Subjects)**: A quién se aplica la política (roles, usuarios, grupos)
2. **Recursos (Resources)**: A qué recursos se puede acceder
3. **Acciones (Actions)**: Qué operaciones están permitidas
4. **Condiciones (Conditions)**: Cuándo se aplica la política
5. **Atributos de Recursos (Resource Attributes)**: Alcance de recursos por atributos

### Creación de Políticas

#### Ejemplo 1: Política de Gerente de Departamento

Esta política permite a los gerentes gestionar todos los recursos dentro de su departamento.

1. Navegue a **Panel > Políticas**
2. Haga clic en **"Crear Política"**
3. Configure:

**Información Básica:**
- Nombre (Name): "Acceso de Gerente de Departamento"
- Descripción (Description): "Acceso completo a recursos del departamento"
- Alcance (Scope): Organización
- Efecto (Effect): Permitir (Allow)

**Sujetos (Subjects):**
- Roles: ["gerente"]

**Recursos (Resources):**
- Tipos: ["producto (product)", "cliente (customer)", "pedido (order)"]
- Atributos:
  - organizationId: ${subject.organizationId}

**Acciones (Actions):**
- Seleccione todas: crear (create), leer (read), actualizar (update), eliminar (delete), listar (list)

**Guarde la política**

#### Ejemplo 2: Política de Solo Lectura para Auditor

1. Crear nueva política
2. Configure:

**Información Básica:**
- Nombre: "Acceso de Lectura para Auditor"
- Descripción: "Acceso de solo lectura para propósitos de auditoría"
- Alcance: Organización
- Efecto: Permitir

**Sujetos:**
- Roles: ["auditor"]

**Recursos:**
- Tipos: ["*"] (todos los tipos de recursos)
- Atributos:
  - organizationId: ${subject.organizationId}

**Acciones:**
- Seleccione: leer, listar

**Condiciones:**
- Añadir condición: subject.role === 'auditor'

#### Ejemplo 3: Política de Acceso Basado en Tiempo

1. Crear política para contratistas con restricciones de tiempo:

**Información Básica:**
- Nombre: "Acceso en Horario Laboral para Contratista"
- Alcance: Organización
- Efecto: Permitir

**Sujetos:**
- Roles: ["contratista"]

**Recursos:**
- Tipos: ["proyecto", "documento"]
- Atributos:
  - projectId: ${subject.projectId}

**Acciones:**
- leer, actualizar

**Condiciones:**
- Añadir: environment.timeOfDay >= '09:00'
- Añadir: environment.timeOfDay <= '17:00'
- Añadir: environment.dayOfWeek !== 'Domingo'
- Añadir: environment.dayOfWeek !== 'Sábado'

### Características Avanzadas de Políticas

#### Acciones Específicas por Recurso (Resource-Specific Actions)

Ahora puede definir acciones diferentes para diferentes tipos de recursos dentro de una sola política:

1. Haga clic en "Añadir Recurso" (Add Resource) en la pestaña Reglas de Política
2. Seleccione un tipo de recurso (por ejemplo: "User")
3. Marque acciones específicas para ese recurso (por ejemplo: "read", "update")
4. Añada otro recurso con acciones diferentes (por ejemplo: "Product" con "create", "read", "update", "delete")

Esto permite un control preciso donde una sola política puede otorgar permisos diferentes para recursos diferentes.

#### Permisos a Nivel de Campo (Field-Level Permissions)

Controle el acceso a campos específicos dentro de los recursos:

1. Habilite "Permisos a nivel de campo" (Field-level permissions) en la pestaña Permisos de Campo
2. Seleccione un tipo de recurso
3. Para cada tipo de permiso (Legible/Escribible/Denegado - Readable/Writable/Denied):
   - Haga clic en el menú desplegable "Seleccionar campos" (Select fields)
   - Elija campos específicos de listas categorizadas
   - Los campos seleccionados aparecen como insignias debajo
   - Haga clic en "Añadir Seleccionados" (Add Selected) para aplicar

**Reglas de Permisos de Campo:**
- **Legible (Readable)**: Solo estos campos serán devueltos en las respuestas API
- **Escribible (Writable)**: Solo estos campos pueden ser modificados en actualizaciones
- **Denegado (Denied)**: Estos campos están completamente bloqueados (anula otros permisos)
- Use "*" para permitir todos los campos excepto los explícitamente denegados

#### Uso de Variables Dinámicas

Las variables dinámicas permiten que las políticas se adapten al contexto del usuario:

- `${subject.organizationId}` - Organización actual del usuario
- `${subject.departmentId}` - Departamento del usuario
- `${subject.userId}` - ID del usuario
- `${environment.ipAddress}` - IP de la solicitud
- `${environment.timestamp}` - Hora actual

#### Atributos de Recursos

Controle qué recursos específicos afecta una política:

```javascript
// Solo recursos en la organización del usuario (user's organization)
organizationId: "${subject.organizationId}"

// Solo recursos en estado específico (specific status)
status: "activo"

// Solo recursos creados por el usuario (created by user)
createdBy: "${subject.userId}"
```

#### Condiciones Complejas

Combine múltiples condiciones para control detallado:

```javascript
// Gerente puede aprobar pedidos bajo $10,000 (manager can approve orders under $10,000)
subject.role === 'gerente' && resource.amount < 10000

// Acceso solo durante horas de oficina (access only during office hours)
environment.timeOfDay >= '09:00' && environment.timeOfDay <= '18:00'

// Acceso específico por región (region-specific access)
subject.region === resource.region
```

---

## 7. Gestión de Atributos

### Comprendiendo los Atributos

Los atributos son propiedades dinámicas que pueden adjuntarse a:
- **Sujetos (Subjects)** (usuarios): rol (role), departamento (department), nivelAutorización (clearanceLevel)
- **Recursos (Resources)** (objetos): estado (status), propietario (owner), clasificación (classification)
- **Entorno (Environment)** (contexto): tiempo (time), ubicación (location), tipoDispositivo (deviceType)

### Creación de Atributos

#### Ejemplo 1: Crear un Atributo de Nivel de Autorización

1. Navegue a **Panel > Atributos**
2. Haga clic en **"Crear Atributo"**
3. Configure:
   - **Nombre (Name)**: clearanceLevel
   - **Categoría (Category)**: sujeto (subject)
   - **Tipo (Type)**: cadena (string)
   - **Valores Posibles (Possible Values)**: ["público (public)", "interno (internal)", "confidencial (confidential)", "secreto (secret)"]
   - **Descripción (Description)**: "Nivel de autorización de seguridad"
4. Guardar

#### Ejemplo 2: Crear una Clasificación de Recurso

1. Crear nuevo atributo
2. Configure:
   - **Nombre**: classification
   - **Categoría**: recurso
   - **Tipo**: cadena
   - **Valores Posibles**: ["público", "interno", "restringido"]

### Uso de Atributos en Políticas

Una vez creados, los atributos pueden usarse en condiciones de políticas:

```javascript
// Solo usuarios con autorización adecuada (proper clearance)
subject.clearanceLevel === 'secreto' || subject.clearanceLevel === 'confidencial'

// Coincidir autorización con clasificación (match clearance to classification)
subject.clearanceLevel >= resource.classification
```

---

## 8. Mejores Prácticas

### Estructura Organizacional

1. **Mantenerlo Simple (Keep it Simple)**: No cree niveles de jerarquía innecesarios
2. **Agrupación Lógica (Logical Grouping)**: Agrupe por función, no solo geografía
3. **Nombres Consistentes (Consistent Naming)**: Use nombres claros y descriptivos

### Diseño de Roles

1. **Basado en Trabajo (Job-Based)**: Nombre roles según funciones laborales
2. **Evite Nombres de Permisos (Avoid Permission Names)**: No use "puede_editar_productos"
3. **Reutilizable (Reusable)**: Diseñe roles que funcionen entre organizaciones

### Diseño de Políticas

1. **Principio de Menor Privilegio (Principle of Least Privilege)**: Otorgue acceso mínimo necesario
2. **Use Atributos de Recursos (Use Resource Attributes)**: Alcance políticas a organización
3. **Pruebe Exhaustivamente (Test Thoroughly)**: Use probador de políticas antes del despliegue
4. **Documente Propósito (Document Purpose)**: Descripciones claras ayudan al mantenimiento

### Mejores Prácticas de Seguridad

1. **Auditorías Regulares (Regular Audits)**: Revise políticas y acceso trimestralmente
2. **Elimine Acceso Obsoleto (Remove Stale Access)**: Desactive cuentas no utilizadas
3. **Monitoree Cambios (Monitor Changes)**: Rastree modificaciones de políticas
4. **Separación de Funciones (Separation of Duties)**: Divida operaciones sensibles

---

## 9. Solución de Problemas

### Problemas Comunes

#### Errores de "Acceso Denegado"

1. Verifique la organización activa del usuario
2. Verifique que el usuario tenga el rol apropiado
3. Verifique si existen políticas relevantes
4. Pruebe la política con el probador de políticas
5. Verifique que los atributos del recurso coincidan

#### La Política No Funciona

1. Asegúrese de que la política esté activa
2. Verifique el alcance de la política (Sistema vs Organización)
3. Verifique que el sujeto coincida (rol/usuario/grupo)
4. Pruebe condiciones con valores reales
5. Verifique atributos de recursos

#### Problemas de Jerarquía Organizacional

1. Verifique relaciones padre-hijo
2. Verifique que los tipos de organización coincidan con restricciones
3. Asegúrese de que no haya referencias circulares
4. Valide todos los campos requeridos

### Obtener Ayuda

1. Revise registros de auditoría para detalles
2. Use el probador de políticas para depuración
3. Contacte soporte con:
   - ID de usuario
   - ID de organización
   - Hora del problema
   - Mensajes de error

---

## Apéndice A: Biblioteca de Ejemplos de Políticas

### Jerarquía de Aprobación Financiera

```javascript
// Personal junior: hasta $1,000
{
  subjects: { roles: ["personal"] },
  resources: { types: ["orden_compra"] },
  actions: ["crear", "leer"],
  conditions: ["resource.amount <= 1000"]
}

// Gerentes: hasta $10,000
{
  subjects: { roles: ["gerente"] },
  resources: { types: ["orden_compra"] },
  actions: ["crear", "leer", "aprobar"],
  conditions: ["resource.amount <= 10000"]
}

// Directores: hasta $100,000
{
  subjects: { roles: ["director"] },
  resources: { types: ["orden_compra"] },
  actions: ["crear", "leer", "aprobar"],
  conditions: ["resource.amount <= 100000"]
}
```

### Aislamiento de Departamento

```javascript
// Usuarios solo pueden ver datos de su departamento
{
  subjects: { roles: ["usuario"] },
  resources: { 
    types: ["*"],
    attributes: {
      departmentId: "${subject.departmentId}"
    }
  },
  actions: ["leer", "listar"]
}
```

### Colaboración Entre Departamentos

```javascript
// Miembros del proyecto pueden acceder a recursos del proyecto sin importar el departamento
{
  subjects: { groups: ["miembros_proyecto"] },
  resources: { 
    types: ["proyecto", "tarea", "documento"],
    attributes: {
      projectId: "${subject.projects}"
    }
  },
  actions: ["leer", "actualizar", "comentar"]
}
```

## 9. Auditoría de Acceso a Campos (Field Access Audit)

La función de Auditoría de Acceso a Campos proporciona monitoreo integral de los intentos de acceso a nivel de campo en toda su organización.

### Acceso al Registro de Auditoría

1. Navegue a **Panel** → **Auditoría de Acceso a Campos (Field Access Audit)**
2. El registro de auditoría muestra todos los intentos de acceso a campos

### Comprensión de las Entradas de Auditoría

Cada entrada de auditoría muestra:
- **Marca de Tiempo (Timestamp)**: Cuándo ocurrió el acceso
- **Usuario (User)**: Quién intentó el acceso
- **Acción (Action)**: Tipo de acceso (Leer/Escribir/Denegado - Read/Write/Denied)
- **Recurso (Resource)**: A qué se accedió
- **Campos (Fields)**: Qué campos específicos se accedieron
- **Organización (Organization)**: Contexto del acceso
- **Dirección IP (IP Address)**: Origen de la solicitud

### Filtrado de Registros de Auditoría

Use filtros para encontrar patrones de acceso específicos:
- **Búsqueda (Search)**: Encuentre por nombre de usuario o ID de recurso
- **Tipo de Recurso (Resource Type)**: Filtre por Cliente, Usuario, Producto, etc.
- **Acción (Action)**: Muestre solo intentos de Lectura, Escritura o Denegados
- **Rango de Fechas (Date Range)**: Seleccione período de tiempo específico

### Monitoreo de Seguridad

Preste especial atención a:
- **Intentos de Acceso Denegados (Denied Access Attempts)**: Pueden indicar intentos de acceso no autorizado
- **Acceso a Campos Sensibles (Sensitive Field Access)**: Monitoree acceso a SSN, puntajes crediticios, etc.
- **Patrones Inusuales (Unusual Patterns)**: Múltiples intentos denegados o tiempos de acceso inusuales

### Exportación de Datos

1. Aplique los filtros deseados
2. Haga clic en **Exportar CSV (Export CSV)** para descargar datos de auditoría
3. Use para informes de cumplimiento o análisis adicional

---

## Apéndice B: Referencia Rápida

### Jerarquía de Tipo de Organización
- Empresa → División → Departamento → Equipo
- Empresa → Agencia de Seguros → Sucursal de Seguros

### Convención de Nombres de Roles
- Minúsculas con guiones bajos: `regional_manager`
- Nombres mostrados descriptivos: "Gerente Regional"

### Alcance de Política
- **Sistema**: Se aplica a todas las organizaciones
- **Organización**: Se aplica a organización específica

### Variables Dinámicas Comunes
- `${subject.organizationId}`
- `${subject.userId}`
- `${subject.role}`
- `${environment.timestamp}`
- `${resource.owner}`

---

*Última Actualización: Enero 2024*
*Versión: 1.0*