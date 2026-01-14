"""
Test directo del endpoint de productos
"""
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import Product

client = TestClient(app)

print("Probando endpoint GET /api/products...")
try:
    response = client.get("/api/products")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Productos encontrados: {len(data)}")
        if len(data) > 0:
            print(f"Primer producto: {data[0]}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Excepcion: {e}")
    import traceback
    traceback.print_exc()
