# Instrucciones de Ejecución - Sistema Panadería

## 🚀 Inicio Rápido

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

```bash
cd frontend
npm install  # Solo la primera vez
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

## ⚠️ Solución de Problemas

### Si hay errores 500:

1. **Verifica que la base de datos existe:**
```bash
cd backend
python check_db.py
```

2. **Si no hay datos, carga datos de ejemplo:**
```bash
cd backend
python init_db.py
```

3. **Revisa los logs del servidor:**
   - Los errores aparecerán en la consola donde ejecutaste `uvicorn`
   - Busca líneas que digan "ERROR en..."

### Errores comunes:

- **Error 500 al cargar productos/ventas**: Verifica que la base de datos tenga datos
- **Error de conexión**: Asegúrate de que el backend esté corriendo en el puerto 8000
- **Error CORS**: Verifica que el frontend esté en el puerto 5173

## 📝 Verificación

Para verificar que todo funciona:

1. Backend corriendo: Abre http://localhost:8000/docs
2. Frontend corriendo: Abre http://localhost:5173
3. Prueba cargar productos desde el frontend

## 🔧 Comandos Útiles

```bash
# Verificar estado de la base de datos
cd backend
python check_db.py

# Cargar datos de ejemplo
cd backend
python init_db.py

# Ejecutar tests
cd backend
pytest test_api.py
```
