"""
Test completo de todos los endpoints para identificar errores
"""
import sys
import os
from datetime import date

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
except Exception as e:
    print(f"Error al importar TestClient: {e}")
    print("Probando con requests HTTP...")
    import requests
    client = None
    BASE_URL = "http://localhost:8000"

print("=" * 60)
print("TEST DE ENDPOINTS")
print("=" * 60)

# Test 1: Productos
print("\n1. Test GET /api/products")
try:
    if client:
        response = client.get("/api/products")
    else:
        response = requests.get(f"{BASE_URL}/api/products")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Productos encontrados: {len(data)}")
        if len(data) > 0:
            print(f"   Primer producto: {data[0].get('name', 'N/A')}")
    else:
        print(f"   ERROR: {response.text[:500]}")
except Exception as e:
    print(f"   EXCEPCION: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Ventas
print("\n2. Test GET /api/sales")
try:
    response = client.get("/api/sales?limit=5")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Ventas encontradas: {len(data)}")
        if len(data) > 0:
            print(f"   Primera venta ID: {data[0].get('id', 'N/A')}")
    else:
        print(f"   ERROR: {response.text[:200]}")
except Exception as e:
    print(f"   EXCEPCION: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Resumen de ventas
print("\n3. Test GET /api/sales/stats/summary")
try:
    response = client.get("/api/sales/stats/summary")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total: ${data.get('total_amount', 0)}")
        print(f"   Cantidad: {data.get('total_count', 0)}")
    else:
        print(f"   ERROR: {response.text[:200]}")
except Exception as e:
    print(f"   EXCEPCION: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Cierre de caja
print("\n4. Test GET /api/cash-closing")
try:
    today = date.today().isoformat()
    response = client.get(f"/api/cash-closing?closing_date={today}")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Datos recibidos: {list(data.keys())}")
    else:
        print(f"   ERROR: {response.text[:200]}")
except Exception as e:
    print(f"   EXCEPCION: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TEST COMPLETADO")
print("=" * 60)
