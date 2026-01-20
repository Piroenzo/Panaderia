# Instrucciones de Ejecución - Sistema Panadería

## 🚀 Inicio Rápido

### Opción recomendada: Docker (un solo comando)

> Requiere Docker Desktop instalado.

```bash
docker compose up --build -d
```

**Opción ultra simple (Windows):**  
Hacer doble click en `start_panaderia.bat` para iniciar.  
Hacer doble click en `stop_panaderia.bat` para detener.

Frontend: **http://localhost:5173**  
Backend: **http://localhost:8000**  
Docs API: **http://localhost:8000/docs**

Para detener los servicios:

```bash
docker compose down
```

### Backend (API FastAPI)

**Opción 1: Desde la terminal**

```bash
cd backend
uvicorn main:app --reload
```

**Opción 2: Usando el script (Windows)**

```bash
cd backend
start_server.bat
```

**Opción 3: Usando el script (Linux/Mac)**

```bash
cd backend
chmod +x start_server.sh
./start_server.sh
```

El servidor estará disponible en: **http://localhost:8000**
Documentación interactiva: **http://localhost:8000/docs**

### Frontend (React + Vite)
