"""
Database Module
Manages Prisma client connection
"""
from prisma import Prisma
from functools import lru_cache
from app.config import get_settings

settings = get_settings()

class Database:
    """
    Singleton Prisma Client manager
    """
    def __init__(self):
        self.client = Prisma()
        self._is_connected = False

    async def connect(self):
        """Connect to the database if not already connected"""
        if not self._is_connected:
            await self.client.connect()
            self._is_connected = True

    async def disconnect(self):
        """Disconnect from the database"""
        if self._is_connected:
            await self.client.disconnect()
            self._is_connected = False

@lru_cache()
def get_db():
    """
    Get singleton database manager
    """
    return Database()

async def ensure_db_connection():
    """
    Ensure the global database client is connected
    Useful for startup events
    """
    db = get_db()
    await db.connect()
    return db.client
