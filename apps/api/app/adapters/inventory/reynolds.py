import uuid

from app.adapters.inventory.base import InventoryAdapter
from app.schemas.normalized_vehicle import NormalizedVehicle

_SUPPORTED_TRANSPORTS = {"csv", "xml", "api", "sftp"}


class ReynoldsAdapter(InventoryAdapter):
    """Reynolds & Reynolds adapter scaffold — implementation pending pilot export format."""

    def test_connection(self, config: dict) -> None:
        transport = config.get("transport")
        if transport not in _SUPPORTED_TRANSPORTS:
            raise ValueError(
                f"config.transport must be one of {sorted(_SUPPORTED_TRANSPORTS)}"
            )
        if transport in {"csv", "xml", "sftp"} and not config.get("file_path"):
            raise ValueError(f"config.file_path is required for Reynolds {transport} transport")
        if transport == "api" and not config.get("api_base_url"):
            raise ValueError("config.api_base_url is required for Reynolds API transport")

    def fetch_inventory(
        self, dealership_id: uuid.UUID, config: dict
    ) -> list[NormalizedVehicle]:
        self.test_connection(config)
        raise NotImplementedError(
            "Reynolds adapter is not implemented until pilot dealer export format is confirmed"
        )
