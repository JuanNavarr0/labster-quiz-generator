# Labster Quiz Generator

Una aplicación web moderna que genera contenido educativo y cuestionarios interactivos basados en objetivos de aprendizaje utilizando tecnología LLM.

## Descripción del Proyecto

Esta aplicación integra un frontend en React con un backend en FastAPI para crear una herramienta educativa que:

1. Recibe un objetivo de aprendizaje como entrada
2. Genera un resumen teórico del tema
3. Crea preguntas de opción múltiple para evaluar la comprensión
4. Califica las respuestas del usuario y proporciona retroalimentación

## Arquitectura Técnica

### Backend (FastAPI)

El backend está construido con FastAPI y proporciona dos endpoints principales:

- `/theory/generate_theory` - Genera contenido teórico verificado científicamente
- `/quiz/generate_quiz` - Crea preguntas de opción múltiple con verificación científica

La aplicación utiliza un sistema de Generación Aumentada por Recuperación (RAG) para garantizar la precisión científica:

- **Base de Datos Vectorial**: Almacena embeddings del contenido de libros de texto OpenStax
- **Sistema de Recuperación**: Encuentra contenido científico relevante para cada consulta
- **Prompts Mejorados**: Aumenta los prompts de LLM con información científica verificada
- **Lógica de Verificación**: Evalúa la confianza en la precisión científica de las respuestas

El backend aprovecha los modelos GPT de OpenAI combinados con el sistema RAG para generar contenido educativo y preguntas de cuestionario de alta calidad y precisión científica.

### Frontend (React)

El frontend proporciona una interfaz de usuario intuitiva con tres pantallas principales:

1. **Pantalla de Entrada** - Los usuarios ingresan o seleccionan un objetivo de aprendizaje
2. **Pantalla de Teoría** - Muestra el contenido teórico generado
3. **Pantalla de Cuestionario** - Presenta preguntas interactivas de opción múltiple con calificación

## Características

- **Entrada de Objetivo de Aprendizaje**: Los usuarios pueden escribir su propio objetivo de aprendizaje o seleccionar entre temas sugeridos
- **Generación Dinámica de Contenido**: El contenido educativo se genera bajo demanda usando IA
- **Verificación Científica**: El contenido se verifica con fuentes de libros de texto utilizando tecnología RAG
- **Cuestionario Interactivo**: Preguntas de opción múltiple con retroalimentación inmediata
- **Diseño Responsivo**: Funciona en dispositivos de escritorio y móviles
- **Navegación**: Flujo intuitivo entre estados de la aplicación
- **Manejo de Errores**: Retroalimentación clara para solicitudes API fallidas o problemas de validación
- **Indicadores de Calidad**: Advertencias transparentes cuando el contenido no puede ser completamente verificado con fuentes científicas

## Comenzando

### Requisitos Previos

- Node.js (v16+)
- Python (v3.9+)
- Una clave API de OpenAI

### Configuración del Backend

1. Navega al directorio del backend
2. Crea un entorno virtual: `python -m venv venv`
3. Activa el entorno virtual:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Instala las dependencias: `pip install -r requirements.txt`
5. Crea un archivo `.env` con tu clave API de OpenAI:
   ```
   OPENAI_API_KEY=tu_clave_api_aquí
   ```
6. Procesa los libros de texto para el sistema RAG:

   ```
   python -m scripts.process_textbooks --source_dir "ruta/a/tus/libros" --output_dir "data"
   ```

   Esto:

   - Extraerá texto de libros de texto PDF
   - Procesará y limpiará el contenido
   - Creará embeddings utilizando sentence-transformers
   - Construirá un índice vectorial FAISS para una recuperación eficiente

7. Inicia el servidor FastAPI: `uvicorn app.main:app --reload`

### Configuración del Frontend

1. Navega al directorio del frontend
2. Instala las dependencias: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`
4. Accede a la aplicación en `http://localhost:5173`

## Despliegue

### Despliegue del Backend

La aplicación FastAPI puede desplegarse en varias plataformas en la nube:

**Heroku**:

1. Crea un archivo Procfile con: `web: uvicorn app.main:app --host=0.0.0.0 --port=${PORT:-5000}`
2. Establece variables de entorno en el panel de Heroku
3. Despliega usando Heroku CLI o integración con GitHub

**AWS (usando Elastic Beanstalk)**:

1. Crea un entorno de Elastic Beanstalk con la plataforma Python
2. Configura variables de entorno para la clave API de OpenAI
3. Despliega usando EB CLI o la consola AWS

### Despliegue del Frontend

La aplicación React puede desplegarse en:

**Vercel/Netlify**:

1. Conecta tu repositorio GitHub
2. Establece el comando de build como `npm run build`
3. Configura variables de entorno si es necesario

**AWS S3 + CloudFront**:

1. Construye la aplicación: `npm run build`
2. Sube el directorio build a un bucket S3
3. Configura CloudFront para la distribución

## Estructura del Código

### Archivos del Backend

- `main.py` - Punto de entrada de la aplicación y configuración de FastAPI
- `app/api/quiz_endpoints.py` - Endpoint de generación de cuestionarios con verificación científica
- `app/api/theory_endpoints.py` - Endpoint de generación de teoría con verificación científica
- `app/core/openai_client.py` - Integración de API de OpenAI con mejora RAG
- `app/core/rag_system.py` - Implementación central de RAG para verificación científica
- `app/models/quiz_models.py` - Modelos Pydantic para validación de solicitud/respuesta
- `app/models/rag_models.py` - Modelos Pydantic para el sistema RAG
- `app/utils/document_processor.py` - Utilidades para procesar contenido de libros de texto
- `scripts/process_textbooks.py` - Script para procesar libros de texto y construir la base de datos vectorial

### Archivos del Frontend

- `main.jsx` - Punto de entrada de la aplicación React
- `App.jsx` - Componente principal de la aplicación con gestión de estado
- `App.css` - Estilos con diseño responsivo

## Decisiones de Desarrollo

1. **Diseño UI/UX**:

   - Diseño limpio y minimalista centrado en el contenido
   - Flujo paso a paso para una mejor experiencia de usuario
   - Retroalimentación visual para respuestas de cuestionario
   - Indicadores de advertencia transparentes para verificación científica

2. **Estructura de API**:

   - Endpoints separados para teoría y cuestionarios por modularidad
   - Uso de modelos Pydantic para validación de solicitudes
   - Implementación de manejo de errores para operación robusta
   - Respuestas mejoradas con metadatos de verificación científica

3. **Gestión de Estado**:

   - Uso de useState de React para el estado de la aplicación
   - Clara separación de estados UI (entrada, teoría, cuestionario)
   - Flujo de datos manejable entre componentes

4. **Verificación Científica**:
   - Uso de sentence-transformers para embedding local y reducir costos de API
   - Implementación de FAISS para búsqueda vectorial eficiente
   - Desarrollo de un sistema de puntuación de confianza para determinar cuándo se necesitan advertencias
   - Prompts LLM mejorados con contenido científico relevante de libros de texto

## Mejoras Futuras

1. **Recuperación Mejorada de Errores**:

   - Implementar mecanismos de reintento para fallos de API
   - Añadir mensajes de error más detallados

2. **Mejoras de UI**:

   - Animaciones para transiciones entre pantallas
   - Indicadores de progreso para completar cuestionarios
   - Retroalimentación más detallada para resultados de cuestionarios

3. **Optimizaciones de Rendimiento**:

   - Implementar caché para contenido generado
   - Optimizar llamadas API para tiempos de respuesta más rápidos

4. **Características Adicionales**:
   - Soporte para diferentes tipos de preguntas (no solo opción múltiple)
   - Funcionalidad de guardar/exportar para contenido generado
   - Cuentas de usuario para seguir el progreso de aprendizaje

## Autor

Juan Navarro Muñoz
