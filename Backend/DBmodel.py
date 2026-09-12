from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from Database import Base


class GmailAccount(Base):
    __tablename__ = "gmail_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    name = Column(
        String(255),
        nullable=True
    )

    photo_url = Column(
        Text,
        nullable=True
    )

    google_token = Column(
        Text,
        nullable=False
    )

    messages = relationship(
        "GmailMessage",
        back_populates="account",
        cascade="all, delete"
    )


class GmailMessage(Base):
    __tablename__ = "gmail_messages"

    id = Column(Integer, primary_key=True, index=True)

    gmail_account_id = Column(
        Integer,
        ForeignKey("gmail_accounts.id"),
        nullable=False
    )

    message_id = Column(String(255), nullable=False)
    name = Column(Text, nullable=False)

    account = relationship(
        "GmailAccount",
        back_populates="messages"
    )