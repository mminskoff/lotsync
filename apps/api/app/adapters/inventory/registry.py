from app.adapters.inventory.base import InventoryAdapter
from app.adapters.inventory.csv_adapter import CsvAdapter
from app.adapters.inventory.nielsen_ddc import NielsenDDCAdapter
from app.adapters.inventory.reynolds import ReynoldsAdapter

_ADAPTERS: dict[str, InventoryAdapter] = {
    "nielsen": NielsenDDCAdapter(),
    "nielsen_ddc": NielsenDDCAdapter(),
    "reynolds": ReynoldsAdapter(),
    "csv": CsvAdapter(),
}


def get_inventory_adapter(source_type: str) -> InventoryAdapter:
    adapter = _ADAPTERS.get(source_type.lower())
    if adapter is None:
        supported = ", ".join(sorted(_ADAPTERS))
        raise ValueError(f"Unsupported inventory source type '{source_type}'. Supported: {supported}")
    return adapter
