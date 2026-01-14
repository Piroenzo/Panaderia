"""
Script para inicializar la base de datos con datos de ejemplo
"""
from database import SessionLocal, engine, Base
from models import Product, Sale, SaleItem, CashClosing
from datetime import date, timedelta
import random

# Crear tablas
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Limpiar datos existentes
    db.query(SaleItem).delete()
    db.query(Sale).delete()
    db.query(CashClosing).delete()
    db.query(Product).delete()
    db.commit()
    
    # Crear productos de ejemplo
    products_data = [
        {"name": "Pan Francés", "category": "Pan", "price": 150.0, "active": True},
        {"name": "Pan Lactal", "category": "Pan", "price": 200.0, "active": True},
        {"name": "Facturas", "category": "Facturas", "price": 80.0, "active": True},
        {"name": "Medialunas", "category": "Facturas", "price": 100.0, "active": True},
        {"name": "Torta de Chocolate", "category": "Tortas", "price": 2500.0, "active": True},
        {"name": "Torta de Frutilla", "category": "Tortas", "price": 2800.0, "active": True},
        {"name": "Alfajores", "category": "Dulces", "price": 120.0, "active": True},
        {"name": "Muffins", "category": "Dulces", "price": 150.0, "active": True},
        {"name": "Croissants", "category": "Facturas", "price": 90.0, "active": True},
        {"name": "Pan Integral", "category": "Pan", "price": 180.0, "active": True},
    ]
    
    products = []
    for p_data in products_data:
        product = Product(**p_data)
        db.add(product)
        products.append(product)
    
    db.commit()
    
    # Crear ventas de ejemplo (últimos 7 días)
    payment_methods = ["efectivo", "tarjeta", "transferencia", "mixto"]
    today = date.today()
    
    for day_offset in range(7):
        sale_date = today - timedelta(days=day_offset)
        num_sales = random.randint(3, 8)
        
        for _ in range(num_sales):
            # Crear venta
            sale = Sale(
                date=sale_date,
                payment_method=random.choice(payment_methods),
                total=0,  # Se calculará después
                notes=None
            )
            db.add(sale)
            db.flush()
            
            # Agregar items
            num_items = random.randint(1, 4)
            selected_products = random.sample(products, min(num_items, len(products)))
            total = 0
            
            for product in selected_products:
                quantity = random.randint(1, 5)
                unit_price = product.price
                total += quantity * unit_price
                
                item = SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price
                )
                db.add(item)
            
            sale.total = total
            db.flush()
    
    db.commit()
    
    # Crear algunos cierres de caja de ejemplo
    for day_offset in range(3):
        closing_date = today - timedelta(days=day_offset)
        
        # Calcular totales del día
        sales = db.query(Sale).filter(Sale.date == closing_date).all()
        total_sales = sum(sale.total for sale in sales)
        total_cash_sales = sum(
            sale.total for sale in sales
            if sale.payment_method in ["efectivo", "mixto"]
        )
        
        initial_cash = 5000.0
        expenses = random.randint(500, 2000)
        withdrawals = random.randint(0, 1000)
        counted_cash = initial_cash + total_cash_sales - expenses - withdrawals + random.randint(-200, 200)
        difference = counted_cash - (initial_cash + total_cash_sales - expenses - withdrawals)
        
        closing = CashClosing(
            date=closing_date,
            initial_cash=initial_cash,
            counted_cash=counted_cash,
            total_sales=total_sales,
            total_cash_sales=total_cash_sales,
            expenses=expenses,
            expense_notes=f"Gastos del día {closing_date}",
            withdrawals=withdrawals,
            difference=difference,
            notes=None
        )
        db.add(closing)
    
    db.commit()
    
    print("✅ Base de datos inicializada con datos de ejemplo")
    print(f"   - {len(products)} productos creados")
    print(f"   - Ventas de ejemplo creadas para los últimos 7 días")
    print(f"   - Cierres de caja de ejemplo creados")
    
except Exception as e:
    db.rollback()
    print(f"❌ Error al inicializar base de datos: {e}")
finally:
    db.close()
