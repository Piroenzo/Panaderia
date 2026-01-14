"""
Script para verificar el estado de la base de datos
"""
import sys
import os
from sqlalchemy import inspect, text
from database import engine, SessionLocal
from models import Product, Sale, SaleItem, CashClosing, Base

def check_database():
    """Verificar estado de la base de datos"""
    print("Verificando base de datos...")
    print("-" * 50)
    
    # Verificar si existe el archivo
    db_path = "panaderia.db"
    if os.path.exists(db_path):
        print(f"[OK] Archivo de base de datos existe: {db_path}")
        size = os.path.getsize(db_path)
        print(f"   Tamaño: {size} bytes")
    else:
        print(f"[ERROR] Archivo de base de datos NO existe: {db_path}")
        print("   Creando tablas...")
        Base.metadata.create_all(bind=engine)
        print("   [OK] Tablas creadas")
        return
    
    # Verificar conexión
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("[OK] Conexion a la base de datos exitosa")
    except Exception as e:
        print(f"[ERROR] Error al conectar: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Verificar tablas
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nTablas encontradas: {len(tables)}")
    for table in tables:
        print(f"   - {table}")
    
    expected_tables = ["products", "sales", "sale_items", "cash_closings"]
    missing_tables = [t for t in expected_tables if t not in tables]
    
    if missing_tables:
        print(f"\n[WARNING] Faltan tablas: {missing_tables}")
        print("   Creando tablas faltantes...")
        Base.metadata.create_all(bind=engine)
        print("   [OK] Tablas creadas")
    else:
        print("[OK] Todas las tablas existen")
    
    # Verificar datos
    db = SessionLocal()
    try:
        product_count = db.query(Product).count()
        sale_count = db.query(Sale).count()
        closing_count = db.query(CashClosing).count()
        
        print(f"\nDatos en la base de datos:")
        print(f"   - Productos: {product_count}")
        print(f"   - Ventas: {sale_count}")
        print(f"   - Cierres de caja: {closing_count}")
        
        if product_count == 0:
            print("\n[WARNING] No hay productos. Ejecuta: python init_db.py")
        
        # Probar consulta de productos
        print("\nProbando consulta de productos...")
        products = db.query(Product).limit(5).all()
        print(f"   Productos encontrados: {len(products)}")
        for p in products:
            print(f"   - {p.name} (${p.price})")
            
    except Exception as e:
        print(f"\n[ERROR] Error al consultar datos: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    
    print("\n" + "-" * 50)
    print("[OK] Verificacion completada")

if __name__ == "__main__":
    check_database()
