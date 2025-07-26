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

Bienvenido al Manual del Usuario de la Plataforma SAAS. Esta guía completa le ayudará a comprender y utilizar eficazmente el sistema avanzado de gestión de permisos basado en Control de Acceso Basado en Atributos (ABAC).

### Conceptos Clave

- **Organizaciones**: Estructuras jerárquicas que representan empresas, divisiones, departamentos y equipos
- **Usuarios**: Cuentas individuales que pueden pertenecer a múltiples organizaciones
- **Roles**: Funciones laborales o puestos (p.ej., Gerente, Auditor)
- **Políticas**: Reglas que definen qué acciones pueden realizar los usuarios
- **Atributos**: Propiedades dinámicas utilizadas en la evaluación de políticas

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
Empresa
├── División
│   ├── Departamento
│   │   └── Equipo
├── Agencia de Seguros
│   └── Sucursal de Seguros
```

### Creación de Organizaciones

#### Ejemplo 1: Crear una Empresa

1. Navegue a **Panel > Organizaciones**
2. Haga clic en **"Crear Organización"**
3. Complete el formulario:
   - **Nombre**: "Corporación Acme"
   - **Tipo**: Empresa
   - **Padre**: (dejar vacío para empresas raíz)
   - **Descripción**: "Entidad corporativa principal"
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

- **Activo**: El usuario puede iniciar sesión y acceder a recursos
- **Inactivo**: El usuario no puede iniciar sesión
- **Suspendido**: Restricción temporal, puede ser reactivado

---

## 5. Gestión de Roles

### Comprendiendo los Roles

Los roles definen funciones laborales, NO permisos. Ejemplos:
- **Admin**: Administrador de organización
- **Gerente**: Gerente de departamento o equipo
- **Auditor**: Acceso de solo lectura para cumplimiento
- **Usuario**: Usuario estándar

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

1. **Sujetos**: A quién se aplica la política (roles, usuarios, grupos)
2. **Recursos**: A qué recursos se puede acceder
3. **Acciones**: Qué operaciones están permitidas
4. **Condiciones**: Cuándo se aplica la política
5. **Atributos de Recursos**: Alcance de recursos por atributos

### Creación de Políticas

#### Ejemplo 1: Política de Gerente de Departamento

Esta política permite a los gerentes gestionar todos los recursos dentro de su departamento.

1. Navegue a **Panel > Políticas**
2. Haga clic en **"Crear Política"**
3. Configure:

**Información Básica:**
- Nombre: "Acceso de Gerente de Departamento"
- Descripción: "Acceso completo a recursos del departamento"
- Alcance: Organización
- Efecto: Permitir

**Sujetos:**
- Roles: ["gerente"]

**Recursos:**
- Tipos: ["producto", "cliente", "pedido"]
- Atributos:
  - organizationId: ${subject.organizationId}

**Acciones:**
- Seleccione todas: crear, leer, actualizar, eliminar, listar

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
// Solo recursos en la organización del usuario
organizationId: "${subject.organizationId}"

// Solo recursos en estado específico
status: "activo"

// Solo recursos creados por el usuario
createdBy: "${subject.userId}"
```

#### Condiciones Complejas

Combine múltiples condiciones para control detallado:

```javascript
// Gerente puede aprobar pedidos bajo $10,000
subject.role === 'gerente' && resource.amount < 10000

// Acceso solo durante horas de oficina
environment.timeOfDay >= '09:00' && environment.timeOfDay <= '18:00'

// Acceso específico por región
subject.region === resource.region
```

---

## 7. Gestión de Atributos

### Comprendiendo los Atributos

Los atributos son propiedades dinámicas que pueden adjuntarse a:
- **Sujetos** (usuarios): rol, departamento, nivelAutorización
- **Recursos** (objetos): estado, propietario, clasificación
- **Entorno** (contexto): tiempo, ubicación, tipoDispositivo

### Creación de Atributos

#### Ejemplo 1: Crear un Atributo de Nivel de Autorización

1. Navegue a **Panel > Atributos**
2. Haga clic en **"Crear Atributo"**
3. Configure:
   - **Nombre**: clearanceLevel
   - **Categoría**: sujeto
   - **Tipo**: cadena
   - **Valores Posibles**: ["público", "interno", "confidencial", "secreto"]
   - **Descripción**: "Nivel de autorización de seguridad"
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
// Solo usuarios con autorización adecuada
subject.clearanceLevel === 'secreto' || subject.clearanceLevel === 'confidencial'

// Coincidir autorización con clasificación
subject.clearanceLevel >= resource.classification
```

---

## 8. Mejores Prácticas

### Estructura Organizacional

1. **Mantenerlo Simple**: No cree niveles de jerarquía innecesarios
2. **Agrupación Lógica**: Agrupe por función, no solo geografía
3. **Nombres Consistentes**: Use nombres claros y descriptivos

### Diseño de Roles

1. **Basado en Trabajo**: Nombre roles según funciones laborales
2. **Evite Nombres de Permisos**: No use "puede_editar_productos"
3. **Reutilizable**: Diseñe roles que funcionen entre organizaciones

### Diseño de Políticas

1. **Principio de Menor Privilegio**: Otorgue acceso mínimo necesario
2. **Use Atributos de Recursos**: Alcance políticas a organización
3. **Pruebe Exhaustivamente**: Use probador de políticas antes del despliegue
4. **Documente Propósito**: Descripciones claras ayudan al mantenimiento

### Mejores Prácticas de Seguridad

1. **Auditorías Regulares**: Revise políticas y acceso trimestralmente
2. **Elimine Acceso Obsoleto**: Desactive cuentas no utilizadas
3. **Monitoree Cambios**: Rastree modificaciones de políticas
4. **Separación de Funciones**: Divida operaciones sensibles

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