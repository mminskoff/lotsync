import uuid
from abc import ABC, abstractmethod

from app.schemas.normalized_vehicle import NormalizedVehicle


class InventoryAdapter(ABC):
    """Contract for all dealership inventory sources."""

    @abstractmethod
    def test_connection(self, config: dict) -> None:
        """Validate configuration and source connectivity."""

    @abstractmethod
    def fetch_inventory(
        self, dealership_id: uuid.UUID, config: dict
    ) -> list[NormalizedVehicle]:
        """Pull raw inventory and return normalized vehicle records."""
