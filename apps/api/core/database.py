import os
import threading
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

_local = threading.local()


def get_client() -> Client:
    if not getattr(_local, "client", None):
        _local.client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _local.client
