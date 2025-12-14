"""
Database models for NeuroCred
"""
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, Boolean, Text, JSON,
    ForeignKey, Index, CheckConstraint, UniqueConstraint, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from decimal import Decimal

Base = declarative_base()


class User(Base):
    """User model for wallet addresses"""
    __tablename__ = "users"
    
    wallet_address = Column(String(42), primary_key=True)
    email = Column(String(255), nullable=True)
    preferences = Column(JSON, nullable=True)
    gdpr_consent = Column(Boolean, default=False, nullable=False)
    consent_date = Column(DateTime(timezone=True), nullable=True)
    data_deletion_requested = Column(Boolean, default=False, nullable=False)
    deletion_requested_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    scores = relationship("Score", back_populates="user")
    loans = relationship("Loan", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    gdpr_requests = relationship("GDPRRequest", back_populates="user")
    
    __table_args__ = (
        CheckConstraint("wallet_address ~ '^0x[a-fA-F0-9]{40}$'", name="chk_wallet_format"),
        Index('ix_users_wallet_address', 'wallet_address', unique=True),
    )


class Score(Base):
    """Score model for credit scores"""
    __tablename__ = "scores"
    
    wallet_address = Column(String(42), ForeignKey("users.wallet_address"), primary_key=True)
    score = Column(Integer, nullable=False)
    risk_band = Column(Integer, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="scores")
    history = relationship("ScoreHistory", back_populates="score_rel")
    
    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 1000", name="chk_score_range"),
        CheckConstraint("risk_band >= 0 AND risk_band <= 3", name="chk_risk_band"),
    )


class ScoreHistory(Base):
    """Score history model for tracking score changes"""
    __tablename__ = "score_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), ForeignKey("scores.wallet_address"), nullable=False)
    score = Column(Integer, nullable=False)
    risk_band = Column(Integer, nullable=False)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    score_rel = relationship("Score", back_populates="history")
    
    __table_args__ = (
        Index('idx_score_history_wallet', 'wallet_address'),
        Index('idx_score_history_computed', 'computed_at'),
    )


class UserData(Base):
    """User data model for storing additional user information"""
    __tablename__ = "user_data"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False)
    data_key = Column(String(100), nullable=False)
    data_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_user_data_wallet', 'wallet_address'),
        Index('idx_user_data_key', 'data_key'),
    )


class BatchUpdate(Base):
    """Batch update model for tracking batch operations"""
    __tablename__ = "batch_updates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(100), nullable=False, unique=True)
    status = Column(String(20), nullable=False)  # pending, processing, completed, failed
    total_count = Column(Integer, nullable=False)
    processed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'processing', 'completed', 'failed')", name="chk_batch_status"),
        Index('idx_batch_id', 'batch_id'),
    )


class Loan(Base):
    """Loan model for tracking loan records"""
    __tablename__ = "loans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    loan_id = Column(Integer, nullable=False)  # On-chain loan ID
    amount = Column(Numeric(20, 8), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    term_days = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, index=True)  # pending, active, repaid, defaulted, liquidated
    collateral_amount = Column(Numeric(20, 8), nullable=True)
    collateral_token = Column(String(42), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    repaid_at = Column(DateTime(timezone=True), nullable=True)
    tx_hash = Column(String(66), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="loans")
    payments = relationship("LoanPayment", back_populates="loan")
    
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_loan_amount"),
        CheckConstraint("interest_rate >= 0 AND interest_rate <= 100", name="chk_interest_rate"),
        CheckConstraint("term_days > 0", name="chk_term_days"),
        CheckConstraint("status IN ('pending', 'active', 'repaid', 'defaulted', 'liquidated')", name="chk_loan_status"),
        Index('idx_loans_wallet', 'wallet_address'),
        Index('idx_loans_status', 'status'),
        Index('idx_loans_created', 'created_at'),
    )


class LoanPayment(Base):
    """Loan payment model for tracking payment history"""
    __tablename__ = "loan_payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False, index=True)
    amount = Column(Numeric(20, 8), nullable=False)
    payment_type = Column(String(20), nullable=False)  # principal, interest, both
    tx_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    loan = relationship("Loan", back_populates="payments")
    
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_payment_amount"),
        CheckConstraint("payment_type IN ('principal', 'interest', 'both')", name="chk_payment_type"),
        Index('idx_payments_loan', 'loan_id'),
    )


class Transaction(Base):
    """Transaction model for on-chain transaction records"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    tx_hash = Column(String(66), nullable=False, unique=True, index=True)
    tx_type = Column(String(50), nullable=False, index=True)  # native_send, native_receive, erc20_transfer, contract_call, etc.
    block_number = Column(Integer, nullable=True, index=True)
    block_timestamp = Column(DateTime(timezone=True), nullable=True, index=True)
    from_address = Column(String(42), nullable=True, index=True)
    to_address = Column(String(42), nullable=True, index=True)
    value = Column(Numeric(20, 8), nullable=True)
    gas_used = Column(Integer, nullable=True)
    gas_price = Column(Integer, nullable=True)
    status = Column(String(20), nullable=True)  # pending, success, failed
    # Enhanced fields for transaction indexing
    input_data = Column(Text, nullable=True)  # Transaction input data (truncated)
    contract_address = Column(String(42), nullable=True, index=True)  # Contract interacted with
    method_id = Column(String(10), nullable=True)  # First 4 bytes of method signature
    token_transfers_count = Column(Integer, default=0)  # Number of token transfers in this tx
    metadata = Column(JSON, nullable=True)  # Additional metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    token_transfers = relationship("TokenTransfer", back_populates="transaction")
    
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'success', 'failed') OR status IS NULL", name="chk_tx_status"),
        Index('idx_transactions_wallet', 'wallet_address'),
        Index('idx_transactions_hash', 'tx_hash', unique=True),
        Index('idx_transactions_type', 'tx_type'),
        Index('idx_transactions_timestamp', 'block_timestamp'),
    )


class TokenTransfer(Base):
    """Token transfer model for ERC-20/ERC-721 transfers"""
    __tablename__ = "token_transfers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tx_hash = Column(String(66), ForeignKey("transactions.tx_hash"), nullable=False, index=True)
    token_address = Column(String(42), nullable=False, index=True)
    token_type = Column(String(20), nullable=False)  # ERC20, ERC721
    from_address = Column(String(42), nullable=True, index=True)
    to_address = Column(String(42), nullable=True, index=True)
    amount = Column(Numeric(36, 0), nullable=True)  # For ERC20 (can be very large)
    token_id = Column(Numeric(36, 0), nullable=True)  # For ERC721
    block_number = Column(Integer, nullable=True, index=True)
    block_timestamp = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    transaction = relationship("Transaction", back_populates="token_transfers")
    
    __table_args__ = (
        Index('idx_token_transfers_token', 'token_address'),
        Index('idx_token_transfers_from', 'from_address'),
        Index('idx_token_transfers_to', 'to_address'),
        Index('idx_token_transfers_block', 'block_number'),
    )


class GDPRRequest(Base):
    """GDPR request model for tracking data access/deletion requests"""
    __tablename__ = "gdpr_requests"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    request_type = Column(String(20), nullable=False)  # deletion, export, access
    status = Column(String(20), nullable=False)  # pending, processing, completed, failed
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    export_file_path = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="gdpr_requests")
    
    __table_args__ = (
        CheckConstraint("request_type IN ('deletion', 'export', 'access')", name="chk_gdpr_request_type"),
        CheckConstraint("status IN ('pending', 'processing', 'completed', 'failed')", name="chk_gdpr_status"),
        Index('idx_gdpr_wallet', 'wallet_address'),
        Index('idx_gdpr_status', 'status'),
    )


class DataRetentionLog(Base):
    """Data retention log model for tracking data cleanup operations"""
    __tablename__ = "data_retention_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(100), nullable=False, index=True)
    records_deleted = Column(Integer, nullable=False)
    archived_count = Column(Integer, nullable=False, server_default='0')
    retention_period_days = Column(Integer, nullable=False)
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    status = Column(String(20), nullable=True)  # success, failed, partial
    
    __table_args__ = (
        CheckConstraint("status IN ('success', 'failed', 'partial') OR status IS NULL", name="chk_retention_status"),
        Index('idx_retention_table', 'table_name'),
        Index('idx_retention_executed', 'executed_at'),
    )


class ABExperiment(Base):
    """A/B testing experiment model"""
    __tablename__ = "ab_experiments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    variant_a_name = Column(String(50), nullable=False)  # e.g., "rule_based"
    variant_b_name = Column(String(50), nullable=False)  # e.g., "ml_model_v1"
    allocation_ratio = Column(Numeric(3, 2), nullable=False, default=0.5)  # 0.5 = 50/50 split
    status = Column(String(20), nullable=False, default="draft")  # draft, active, paused, completed
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    allocations = relationship("ABAllocation", back_populates="experiment")
    metrics = relationship("ABMetric", back_populates="experiment")
    
    __table_args__ = (
        CheckConstraint("allocation_ratio >= 0 AND allocation_ratio <= 1", name="chk_allocation_ratio"),
        CheckConstraint("status IN ('draft', 'active', 'paused', 'completed')", name="chk_experiment_status"),
        Index('idx_experiment_status', 'status'),
    )


class ABAllocation(Base):
    """User allocation to experiment variants"""
    __tablename__ = "ab_allocations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(Integer, ForeignKey("ab_experiments.id"), nullable=False, index=True)
    wallet_address = Column(String(42), nullable=False, index=True)
    variant = Column(String(50), nullable=False)  # "A" or "B"
    allocated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    experiment = relationship("ABExperiment", back_populates="allocations")
    
    __table_args__ = (
        UniqueConstraint('experiment_id', 'wallet_address', name='uq_experiment_user'),
        Index('idx_allocation_experiment_user', 'experiment_id', 'wallet_address'),
    )


class ABMetric(Base):
    """Metrics tracked for A/B experiments"""
    __tablename__ = "ab_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(Integer, ForeignKey("ab_experiments.id"), nullable=False, index=True)
    wallet_address = Column(String(42), nullable=True, index=True)
    variant = Column(String(50), nullable=False)  # "A" or "B"
    metric_name = Column(String(50), nullable=False)  # e.g., "default_rate", "score_distribution"
    metric_value = Column(Numeric(20, 8), nullable=True)
    metric_data = Column(JSON, nullable=True)  # Additional metric data
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    experiment = relationship("ABExperiment", back_populates="metrics")
    
    __table_args__ = (
        Index('idx_metric_experiment_variant', 'experiment_id', 'variant'),
        Index('idx_metric_recorded', 'recorded_at'),
    )
