"""
Database seeding script.
Run with: python -m app.seed.seed_data
"""

from app.core.database import SessionLocal, engine, Base
from app.models import (
    Proveedor, Cliente, CentroCosto, CategoriaGasto,
    FacturaProveedor, FacturaCliente, Presupuesto,
    CuentaBancaria,
)
from datetime import date

SEED_PROVEEDORES = [
    {"nombre": "Suministros SAS", "nit": "900123456-7", "contacto": "Carlos", "telefono": "3001112233"},
    {"nombre": "Tecnología Integral Ltda", "nit": "800789012-3", "contacto": "Ana", "telefono": "3004445566"},
    {"nombre": "Oficina Express", "nit": "901345678-9", "contacto": "Pedro", "telefono": "3007778899"},
]

SEED_CLIENTES = [
    {"nombre": "Empresa Demo SA", "nit": "890123456-1", "contacto": "Luis", "telefono": "3101112233"},
    {"nombre": "Corporación Andina", "nit": "830567890-2", "contacto": "Maria", "telefono": "3104445566"},
]

SEED_CENTROS = [
    {"codigo": "CC-ADM", "nombre": "Administración"},
    {"codigo": "CC-VEN", "nombre": "Ventas"},
    {"codigo": "CC-OPE", "nombre": "Operaciones"},
    {"codigo": "CC-TI", "nombre": "Tecnología"},
]

SEED_CATEGORIAS = [
    {"codigo": "CG-SRV", "nombre": "Servicios"},
    {"codigo": "CG-INS", "nombre": "Insumos"},
    {"codigo": "CG-VIA", "nombre": "Viajes"},
    {"codigo": "CG-LIC", "nombre": "Licencias"},
]

SEED_CUENTAS = [
    {"banco": "Banco Nacional", "numero_cuenta": "000-123456-7", "tipo_cuenta": "corriente", "saldo_inicial": 10000000},
    {"banco": "Banco Regional", "numero_cuenta": "000-765432-1", "tipo_cuenta": "ahorros", "saldo_inicial": 5000000},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Proveedor).count() > 0:
        print("Base ya tiene datos, omitiendo seed.")
        db.close()
        return

    proveedores = [Proveedor(**p) for p in SEED_PROVEEDORES]
    db.add_all(proveedores)
    db.flush()

    clientes = [Cliente(**c) for c in SEED_CLIENTES]
    db.add_all(clientes)
    db.flush()

    centros = [CentroCosto(**c) for c in SEED_CENTROS]
    db.add_all(centros)
    db.flush()

    categorias = [CategoriaGasto(**c) for c in SEED_CATEGORIAS]
    db.add_all(categorias)
    db.flush()

    cuentas = [CuentaBancaria(**c) for c in SEED_CUENTAS]
    db.add_all(cuentas)
    db.flush()

    db.add_all([
        FacturaProveedor(proveedor_id=proveedores[0].id, numero_factura="FP-001",
                         fecha_emision=date(2026, 1, 15), monto=1500000, saldo_pendiente=1500000),
        FacturaProveedor(proveedor_id=proveedores[1].id, numero_factura="FP-002",
                         fecha_emision=date(2026, 2, 1), monto=3200000, saldo_pendiente=0, estado="pagada"),
    ])
    db.add_all([
        FacturaCliente(cliente_id=clientes[0].id, numero_factura="FC-001",
                       fecha_emision=date(2026, 1, 20), monto=4500000, saldo_pendiente=4500000),
        FacturaCliente(cliente_id=clientes[1].id, numero_factura="FC-002",
                       fecha_emision=date(2026, 2, 5), monto=7800000, saldo_pendiente=2500000),
    ])
    db.add_all([
        Presupuesto(centro_costo_id=centros[0].id, categoria_gasto_id=categorias[0].id,
                    anio=2026, mes=1, monto_asignado=5000000),
        Presupuesto(centro_costo_id=centros[2].id, categoria_gasto_id=categorias[1].id,
                    anio=2026, mes=1, monto_asignado=3000000),
    ])

    db.commit()
    db.close()
    print("Seed completado exitosamente.")


if __name__ == "__main__":
    seed()
