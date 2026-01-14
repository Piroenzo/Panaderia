from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime
import os

from database import SessionLocal, engine, Base
from models import Product, Sale, SaleItem, CashClosing
from schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    SaleCreate, SaleUpdate, SaleResponse, SaleItemCreate, SaleItemResponse,
    CashClosingCreate, CashClosingUpdate, CashClosingResponse, CashClosingSummary
)

# Crear tablas
Base.metadata.create_all(bind=engine)

# Nota: Para cargar datos de ejemplo, ejecutar manualmente: python init_db.py

app = FastAPI(
    title="API Panadería",
    description="API para gestión de ventas y cierre de caja",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency para obtener DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper para serializar venta con nombres de productos
def serialize_sale(sale: Sale, db: Session) -> dict:
    """Serializa una venta incluyendo nombres de productos en los items"""
    items_data = []
    # Asegurar que los items estén cargados
    try:
        # Forzar la carga de items si no están cargados
        _ = sale.items  # Esto fuerza la carga lazy
        for item in sale.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            item_dict = {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "product_name": product.name if product else None
            }
            items_data.append(item_dict)
    except Exception as e:
        # Si hay error al cargar items, intentar cargarlos manualmente
        print(f"Warning: Error al cargar items de venta {sale.id}: {e}")
        items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            item_dict = {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "product_name": product.name if product else None
            }
            items_data.append(item_dict)
    
    return {
        "id": sale.id,
        "date": sale.date,
        "payment_method": sale.payment_method,
        "total": sale.total,
        "notes": sale.notes,
        "items": items_data,
        "created_at": sale.created_at,
        "updated_at": sale.updated_at
    }


# ============ PRODUCTOS ============

@app.get("/api/products", response_model=List[ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Obtener productos con filtros opcionales"""
    try:
        query = db.query(Product)
        
        if search:
            # SQLite no soporta ilike, usar func.lower() para case-insensitive
            query = query.filter(func.lower(Product.name).like(f"%{search.lower()}%"))
        if category:
            query = query.filter(Product.category == category)
        if active is not None:
            query = query.filter(Product.active == active)
        
        products = query.offset(skip).limit(limit).all()
        return products
    except Exception as e:
        import traceback
        print(f"ERROR en get_products: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener productos: {str(e)}")


@app.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Obtener un producto por ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@app.post("/api/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Crear un nuevo producto"""
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un producto"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Eliminar un producto"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db.delete(db_product)
    db.commit()
    return None


# ============ VENTAS ============

@app.get("/api/sales", response_model=List[SaleResponse])
def get_sales(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    payment_method: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener ventas con filtros opcionales"""
    try:
        # Cargar relaciones con joinedload para evitar problemas de lazy loading
        query = db.query(Sale).options(joinedload(Sale.items))
        
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
        if payment_method:
            query = query.filter(Sale.payment_method == payment_method)
        
        sales = query.order_by(Sale.date.desc(), Sale.id.desc()).offset(skip).limit(limit).all()
        result = []
        for sale in sales:
            try:
                serialized = serialize_sale(sale, db)
                result.append(serialized)
            except Exception as e:
                import traceback
                print(f"ERROR al serializar venta {sale.id}: {e}")
                traceback.print_exc()
                # Continuar con las demás ventas
                continue
        return result
    except Exception as e:
        import traceback
        print(f"ERROR en get_sales: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener ventas: {str(e)}")


@app.get("/api/sales/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    """Obtener una venta por ID"""
    try:
        sale = db.query(Sale).options(joinedload(Sale.items)).filter(Sale.id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Venta no encontrada")
        return serialize_sale(sale, db)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR en get_sale: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener venta: {str(e)}")


@app.post("/api/sales", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    """Crear una nueva venta"""
    try:
        # Calcular el total ANTES de crear la venta
        total = 0
        for item_data in sale.items:
            item_total = item_data.quantity * item_data.unit_price
            total += item_total
        
        # Crear la venta con el total calculado
        sale_data = sale.model_dump(exclude={"items"})
        sale_data["total"] = total  # Asegurar que total no sea None
        db_sale = Sale(**sale_data)
        db.add(db_sale)
        db.flush()
        
        # Crear los items
        for item_data in sale.items:
            db_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_sale)
        # Recargar con items para serializar
        db_sale = db.query(Sale).options(joinedload(Sale.items)).filter(Sale.id == db_sale.id).first()
        return serialize_sale(db_sale, db)
    except Exception as e:
        import traceback
        print(f"ERROR en create_sale: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear venta: {str(e)}")


@app.put("/api/sales/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: int,
    sale_update: SaleUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una venta"""
    db_sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    # Si se actualizan los items, recalcular total
    if sale_update.items is not None:
        # Eliminar items existentes
        db.query(SaleItem).filter(SaleItem.sale_id == sale_id).delete()
        
        # Crear nuevos items
        total = 0
        for item_data in sale_update.items:
            item_total = item_data.quantity * item_data.unit_price
            total += item_total
            db_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price
            )
            db.add(db_item)
        
        db_sale.total = total  # Asegurar que total no sea None
    
    # Actualizar otros campos
    update_data = sale_update.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in update_data.items():
        setattr(db_sale, field, value)
    
    # Asegurar que total nunca sea None
    if db_sale.total is None:
        db_sale.total = 0
    
    db.commit()
    db.refresh(db_sale)
    # Recargar con items para serializar
    db_sale = db.query(Sale).options(joinedload(Sale.items)).filter(Sale.id == sale_id).first()
    return serialize_sale(db_sale, db)


@app.delete("/api/sales/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    """Eliminar una venta"""
    db_sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    db.delete(db_sale)
    db.commit()
    return None


@app.get("/api/sales/stats/summary")
def get_sales_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Obtener resumen de ventas"""
    query = db.query(Sale)
    
    if start_date:
        query = query.filter(Sale.date >= start_date)
    if end_date:
        query = query.filter(Sale.date <= end_date)
    
    sales = query.all()
    
    total_amount = sum(sale.total for sale in sales)
    total_count = len(sales)
    average_ticket = total_amount / total_count if total_count > 0 else 0
    
    # Totales por método de pago
    payment_totals = {}
    for sale in sales:
        method = sale.payment_method
        if method not in payment_totals:
            payment_totals[method] = 0
        payment_totals[method] += sale.total
    
    return {
        "total_amount": total_amount,
        "total_count": total_count,
        "average_ticket": round(average_ticket, 2),
        "payment_totals": payment_totals
    }


# ============ CIERRE DE CAJA ============

@app.get("/api/cash-closing", response_model=CashClosingResponse | CashClosingSummary)
def get_cash_closing(
    closing_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Obtener cierre de caja por fecha"""
    try:
        if not closing_date:
            closing_date = date.today()
        closing = db.query(CashClosing).filter(CashClosing.date == closing_date).first()
        if not closing:
            # Si no existe, calcular totales del día para mostrar en el frontend
            sales = db.query(Sale).filter(Sale.date == closing_date).all()
            total_sales = sum(sale.total for sale in sales)
            total_cash_sales = sum(
                sale.total for sale in sales
                if sale.payment_method in ["efectivo", "mixto"]
            )
            return {
                "date": closing_date,
                "total_sales": total_sales,
                "total_cash_sales": total_cash_sales,
                "exists": False
            }
        return closing
    except Exception as e:
        import traceback
        print(f"ERROR en get_cash_closing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener cierre de caja: {str(e)}")


@app.post("/api/cash-closing", response_model=CashClosingResponse, status_code=status.HTTP_201_CREATED)
def create_cash_closing(closing: CashClosingCreate, db: Session = Depends(get_db)):
    """Crear un nuevo cierre de caja"""
    try:
        # Verificar si ya existe un cierre para esa fecha
        existing = db.query(CashClosing).filter(CashClosing.date == closing.date).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cierre de caja para la fecha {closing.date}"
            )
        
        # Calcular totales de ventas del día
        sales = db.query(Sale).filter(Sale.date == closing.date).all()
        total_sales = sum(sale.total for sale in sales)
        total_cash_sales = sum(
            sale.total for sale in sales
            if sale.payment_method in ["efectivo", "mixto"]
        )
        
        # Calcular diferencia
        expected_cash = (closing.initial_cash or 0) + total_cash_sales - (closing.expenses or 0) - (closing.withdrawals or 0)
        difference = closing.counted_cash - expected_cash
        
        closing_data = closing.model_dump()
        closing_data["total_sales"] = total_sales
        closing_data["total_cash_sales"] = total_cash_sales
        closing_data["difference"] = difference
        
        db_closing = CashClosing(**closing_data)
        db.add(db_closing)
        db.commit()
        db.refresh(db_closing)
        return db_closing
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR en create_cash_closing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al crear cierre de caja: {str(e)}")


@app.put("/api/cash-closing/{closing_id}", response_model=CashClosingResponse)
def update_cash_closing(
    closing_id: int,
    closing_update: CashClosingUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un cierre de caja"""
    try:
        db_closing = db.query(CashClosing).filter(CashClosing.id == closing_id).first()
        if not db_closing:
            raise HTTPException(status_code=404, detail="Cierre de caja no encontrado")
        
        # Recalcular totales si cambió la fecha
        if closing_update.date and closing_update.date != db_closing.date:
            sales = db.query(Sale).filter(Sale.date == closing_update.date).all()
            total_sales = sum(sale.total for sale in sales)
            total_cash_sales = sum(
                sale.total for sale in sales
                if sale.payment_method in ["efectivo", "mixto"]
            )
        else:
            sales = db.query(Sale).filter(Sale.date == db_closing.date).all()
            total_sales = sum(sale.total for sale in sales)
            total_cash_sales = sum(
                sale.total for sale in sales
                if sale.payment_method in ["efectivo", "mixto"]
            )
        
        # Actualizar campos (solo los que se enviaron)
        update_data = closing_update.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            # Convertir strings vacíos a None para campos opcionales
            if value == '' and field in ['expense_notes', 'notes']:
                setattr(db_closing, field, None)
            elif value == '':
                continue  # Saltar strings vacíos para campos numéricos
            else:
                setattr(db_closing, field, value)
        
        # Recalcular diferencia (asegurar que counted_cash no sea None)
        if db_closing.counted_cash is None:
            db_closing.counted_cash = 0
        expected_cash = (db_closing.initial_cash or 0) + total_cash_sales - (db_closing.expenses or 0) - (db_closing.withdrawals or 0)
        db_closing.difference = db_closing.counted_cash - expected_cash
        db_closing.total_sales = total_sales
        db_closing.total_cash_sales = total_cash_sales
        
        db.commit()
        db.refresh(db_closing)
        return db_closing
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR en update_cash_closing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al actualizar cierre de caja: {str(e)}")


@app.get("/api/cash-closing/list", response_model=List[CashClosingResponse])
def list_cash_closings(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Listar todos los cierres de caja"""
    query = db.query(CashClosing)
    
    if start_date:
        query = query.filter(CashClosing.date >= start_date)
    if end_date:
        query = query.filter(CashClosing.date <= end_date)
    
    return query.order_by(CashClosing.date.desc()).offset(skip).limit(limit).all()


@app.get("/")
def root():
    """Endpoint raíz"""
    return {"message": "API Panadería - Ver documentación en /docs"}
