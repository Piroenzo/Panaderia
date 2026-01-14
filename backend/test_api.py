"""
Tests básicos para la API
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from main import app
from database import Base
from models import Product, Sale, SaleItem

# Base de datos de prueba
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Crear tablas y sesión para cada test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de prueba"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_create_product(client):
    """Test crear producto"""
    response = client.post(
        "/api/products",
        json={
            "name": "Pan Test",
            "category": "Pan",
            "price": 100.0,
            "active": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Pan Test"
    assert data["price"] == 100.0


def test_get_products(client):
    """Test obtener productos"""
    # Crear producto primero
    client.post(
        "/api/products",
        json={"name": "Pan Test", "price": 100.0}
    )
    
    response = client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0


def test_create_sale(client, db_session):
    """Test crear venta"""
    # Crear producto primero
    product = Product(name="Pan Test", price=100.0)
    db_session.add(product)
    db_session.commit()
    
    response = client.post(
        "/api/sales",
        json={
            "date": str(date.today()),
            "payment_method": "efectivo",
            "items": [
                {
                    "product_id": product.id,
                    "quantity": 2,
                    "unit_price": 100.0
                }
            ]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 200.0
    assert len(data["items"]) == 1


def test_get_sales_summary(client, db_session):
    """Test obtener resumen de ventas"""
    # Crear producto y venta
    product = Product(name="Pan Test", price=100.0)
    db_session.add(product)
    db_session.commit()
    
    sale = Sale(date=date.today(), payment_method="efectivo", total=200.0)
    db_session.add(sale)
    db_session.flush()
    
    item = SaleItem(sale_id=sale.id, product_id=product.id, quantity=2, unit_price=100.0)
    db_session.add(item)
    db_session.commit()
    
    response = client.get("/api/sales/stats/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_amount" in data
    assert "total_count" in data
