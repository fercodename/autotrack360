Para desarrollar el MVP de **AutoTrack 360°** en Cursor, necesitas un prompt que establezca una arquitectura limpia, modular y con un fuerte enfoque en la "Capa de Confianza" (*Trust Layer*) descrita en tu plan de negocios.

Este prompt está diseñado para una arquitectura moderna (ej. **Next.js + Supabase/PostgreSQL + Tailwind CSS**), priorizando la escalabilidad y la integridad de los datos.

---

## Prompt para Cursor: Desarrollo del MVP AutoTrack 360°

**Contexto del Proyecto:**
Actúa como un Senior Fullstack Engineer y Arquitecto de Software. Vamos a construir el MVP de **AutoTrack 360°**, una plataforma de "Historia Clínica Vehicular". El objetivo es reducir la asimetría de información en el mercado de usados mediante evidencias verificables.

**1. Requerimientos Funcionales Core (MVP):**

* 
**Gestión de Roles:** Implementar roles de Propietario, Taller y Comprador.


* 
**Modelo de Datos Vehículo-Evento:** Entidad Vehículo ligada a Eventos (Service, Reparación, VTV, Inspección).


* 
**Capa de Confianza (Trust Layer):** Cada evidencia (Imagen/PDF) debe generar un hash SHA-256 y un timestamp al cargarse.


* 
**Niveles de Verificación:** Clasificar eventos en A (Firmado por taller), B (Con evidencia) y C (Declarativo).


* 
**Motor de Scoring:** Lógica para calcular el "Score de Confianza" (0-100) basado en Cobertura, Frescura y % de eventos Nivel A.


* 
**Reporte QR Seguro:** Generación de un link único para el historial con TTL (Time-To-Live) y capacidad de revocación.



**2. Stack Tecnológico Sugerido:**

* **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide React (iconografía automotriz).
* **Backend/Auth:** Supabase (PostgreSQL, Auth, Storage).
* 
**Seguridad:** RLS (Row Level Security) para asegurar que solo el dueño o taller autorizado acceda a los datos.


* **Infraestructura:** Edge Functions para el hashing de archivos y generación de QRs.

**3. Instrucciones de Estructura y Código:**

* 
**Base de Datos:** Diseña las tablas siguiendo el modelo `Vehículo -> Evento -> Evidencia -> Fuente`. Asegura integridad referencial.


* 
**Mobile-First:** El frontend debe ser una PWA (Progressive Web App) optimizada para carga rápida en talleres y uso de cámara.


* **Modularidad:** Separa la lógica del "Trust Layer" y del "Scoring Engine" en servicios o utilidades independientes para facilitar el testing y escalado.
* 
**UX de Carga:** Implementar un flujo de carga guiada de 3 pasos que no supere los 2 minutos (p50 < 2').


* 
**API Design:** Estructura endpoints limpios para futuras integraciones con aseguradoras o marketplaces.



**4. Entregable Inmediato:**
Comienza generando el esquema de la base de datos en SQL (compatible con Supabase/PostgreSQL) y la estructura de carpetas del proyecto Next.js. Asegúrate de incluir los campos necesarios para auditoría (created_at, updated_at, hash_sum, metadata).
