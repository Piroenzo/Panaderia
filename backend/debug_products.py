"""
Debug: Probar serialización de productos
"""
from database import SessionLocal
from models import Product
from schemas import ProductResponse

db = SessionLocal()
try:
    print("Obteniendo productos de la base de datos...")
    products = db.query(Product).limit(3).all()
    print(f"Productos encontrados: {len(products)}")
    
    for product in products:
        print(f"\nProducto: {product.name}")
        print(f"  ID: {product.id}")
        print(f"  Precio: {product.price}")
        print(f"  Activo: {product.active}")
        print(f"  Categoria: {product.category}")
        print(f"  Created: {product.created_at}")
        print(f"  Updated: {product.updated_at}")
        
        # Intentar serializar
        try:
            product_dict = {
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "price": product.price,
                "active": product.active,
                "created_at": product.created_at,
                "updated_at": product.updated_at
            }
            print(f"  Dict creado: OK")
            
            # Intentar crear ProductResponse
            response = ProductResponse(**product_dict)
            print(f"  ProductResponse creado: OK")
            print(f"  JSON: {response.model_dump()}")
        except Exception as e:
            print(f"  ERROR al serializar: {e}")
            import traceback
            traceback.print_exc()
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
