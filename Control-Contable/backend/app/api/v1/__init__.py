from fastapi import APIRouter
from app.api.v1 import (
    proveedores,
    facturas_proveedor,
    pagos_proveedor,
    clientes,
    facturas_cliente,
    pagos_cliente,
    centros_costo,
    categorias_gasto,
    presupuesto,
    gastos_internos,
    gastos_externos_pry19,
    cuentas_bancarias,
    extractos_bancarios,
    movimientos_bancarios,
    conciliacion,
    sync_pry19,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(proveedores.router)
api_router.include_router(facturas_proveedor.router)
api_router.include_router(pagos_proveedor.router)
api_router.include_router(clientes.router)
api_router.include_router(facturas_cliente.router)
api_router.include_router(pagos_cliente.router)
api_router.include_router(centros_costo.router)
api_router.include_router(categorias_gasto.router)
api_router.include_router(presupuesto.router)
api_router.include_router(gastos_internos.router)
api_router.include_router(gastos_externos_pry19.router)
api_router.include_router(cuentas_bancarias.router)
api_router.include_router(extractos_bancarios.router)
api_router.include_router(movimientos_bancarios.router)
api_router.include_router(conciliacion.router)
api_router.include_router(sync_pry19.router)
