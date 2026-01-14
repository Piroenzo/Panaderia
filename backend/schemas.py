from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import date, datetime


# ============ PRODUCTOS ============

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    price: float = Field(..., gt=0)
    active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ VENTAS ============

class SaleItemBase(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(SaleItemBase):
    id: int
    product_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class SaleBase(BaseModel):
    date: date
    payment_method: str = Field(..., pattern="^(efectivo|tarjeta|transferencia|mixto)$")
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    items: List[SaleItemCreate] = Field(..., min_items=1)


class SaleUpdate(BaseModel):
    date: Optional[date] = None
    payment_method: Optional[str] = Field(None, pattern="^(efectivo|tarjeta|transferencia|mixto)$")
    items: Optional[List[SaleItemCreate]] = None
    notes: Optional[str] = None


class SaleResponse(SaleBase):
    id: int
    total: float
    items: List[SaleItemResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ CIERRE DE CAJA ============

class CashClosingBase(BaseModel):
    date: date
    initial_cash: Optional[float] = Field(0, ge=0)
    counted_cash: float = Field(..., ge=0)
    expenses: Optional[float] = Field(0, ge=0)
    expense_notes: Optional[str] = None
    withdrawals: Optional[float] = Field(0, ge=0)
    notes: Optional[str] = None


class CashClosingCreate(CashClosingBase):
    pass


class CashClosingUpdate(BaseModel):
    date: Optional[date] = None
    initial_cash: Optional[float] = Field(default=None, ge=0)
    counted_cash: Optional[float] = Field(default=None, ge=0)
    expenses: Optional[float] = Field(default=None, ge=0)
    expense_notes: Optional[str] = None
    withdrawals: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class CashClosingResponse(CashClosingBase):
    id: int
    total_sales: float
    total_cash_sales: float
    difference: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CashClosingSummary(BaseModel):
    date: date
    total_sales: float
    total_cash_sales: float
    exists: bool = False
