from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    price = Column(Float, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con items de venta (lazy loading deshabilitado para evitar problemas de serialización)
    sale_items = relationship("SaleItem", back_populates="product", lazy="noload")


class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(50), nullable=False)  # efectivo, tarjeta, transferencia, mixto
    total = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con items (lazy loading controlado)
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan", lazy="select")


class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    
    # Relaciones (lazy loading controlado)
    sale = relationship("Sale", back_populates="items", lazy="noload")
    product = relationship("Product", back_populates="sale_items", lazy="noload")


class CashClosing(Base):
    __tablename__ = "cash_closings"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    initial_cash = Column(Float, default=0)
    counted_cash = Column(Float, nullable=False)
    total_sales = Column(Float, default=0)
    total_cash_sales = Column(Float, default=0)
    expenses = Column(Float, default=0)
    expense_notes = Column(Text, nullable=True)
    withdrawals = Column(Float, default=0)
    difference = Column(Float, default=0)  # sobrante/faltante
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
