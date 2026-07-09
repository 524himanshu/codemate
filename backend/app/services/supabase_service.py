import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("codemate.supabase")

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        
        # Always initialize in-memory store as a fallback for tables that don't exist yet
        self._db = {
            "roadmaps": {},
            "users": {},
            "lessons": {},
            "resumes": {}
        }
        
        if not self.url or not self.key:
            logger.warning(
                "SUPABASE_URL or SUPABASE_KEY is not set. SupabaseService will run in mock in-memory database mode. "
                "Please configure these in backend/.env to connect to your live database."
            )
            self.client = None
        else:
            try:
                self.client = create_client(self.url, self.key)
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None

    def is_mock(self) -> bool:
        return self.client is None

    # Helper methods to simulate database operations in memory if mock
    def save_roadmap(self, user_id: str, roadmap_data: dict) -> dict:
        if self.is_mock():
            self._db["roadmaps"][user_id] = roadmap_data
            return roadmap_data
        
        try:
            response = self.client.table("roadmaps").upsert({
                "user_id": user_id,
                "data": roadmap_data
            }).execute()
            return response.data[0] if response.data else roadmap_data
        except Exception as e:
            logger.error(f"Supabase DB error saving roadmap: {e}")
            # Fallback to local memory on error to avoid crashing user flow
            self._db["roadmaps"][user_id] = roadmap_data
            return roadmap_data

    def get_roadmap(self, user_id: str) -> dict:
        if self.is_mock():
            return self._db["roadmaps"].get(user_id)
        
        try:
            response = self.client.table("roadmaps").select("*").eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]["data"]
            return None
        except Exception as e:
            logger.error(f"Supabase DB error fetching roadmap: {e}")
            return self._db["roadmaps"].get(user_id)

    def save_lesson_state(self, user_id: str, topic_id: str, lesson_state: dict) -> dict:
        key = f"{user_id}:{topic_id}"
        if self.is_mock():
            self._db["lessons"][key] = lesson_state
            return lesson_state
        try:
            response = self.client.table("lessons").upsert({
                "id": key,
                "user_id": user_id,
                "topic_id": topic_id,
                "state": lesson_state
            }).execute()
            return response.data[0] if response.data else lesson_state
        except Exception as e:
            logger.error(f"Supabase DB error saving lesson state: {e}")
            self._db["lessons"][key] = lesson_state
            return lesson_state

    def get_lesson_state(self, user_id: str, topic_id: str) -> dict:
        key = f"{user_id}:{topic_id}"
        if self.is_mock():
            return self._db["lessons"].get(key)
        try:
            response = self.client.table("lessons").select("*").eq("id", key).execute()
            if response.data:
                return response.data[0]["state"]
            return None
        except Exception as e:
            logger.error(f"Supabase DB error fetching lesson state: {e}")
            return self._db["lessons"].get(key)

db_service = SupabaseService()
