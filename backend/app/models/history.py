from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.sql import func

from app.core.database import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(JSON, nullable=False)
    created_at = Column(String, server_default=func.datetime("now"), nullable=False)
