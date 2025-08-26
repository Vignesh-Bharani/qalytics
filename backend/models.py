from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(50), default="user", nullable=False)  # admin, manager, user
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PnL(Base):
    __tablename__ = "pnls"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    sub_pnls = relationship("SubPnL", back_populates="pnl", cascade="all, delete-orphan")

class SubPnL(Base):
    __tablename__ = "sub_pnls"
    
    id = Column(Integer, primary_key=True, index=True)
    pnl_id = Column(Integer, ForeignKey("pnls.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    pnl = relationship("PnL", back_populates="sub_pnls")
    sub_pnl_metrics = relationship("SubPnLMetrics", back_populates="sub_pnl", cascade="all, delete-orphan")
    sub_pnl_detail_metrics = relationship("SubPnLDetailMetrics", back_populates="sub_pnl", cascade="all, delete-orphan")


# Sub-PnL level metrics (Sub-PnL page level)
class SubPnLMetrics(Base):
    __tablename__ = "sub_pnl_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    sub_pnl_id = Column(Integer, ForeignKey("sub_pnls.id", ondelete="CASCADE"), nullable=False)
    features_shipped = Column(Integer, default=0)
    total_testcases_executed = Column(Integer, default=0)
    total_bugs_logged = Column(Integer, default=0)
    regression_bugs_found = Column(Integer, default=0)
    sanity_time_avg_hours = Column(DECIMAL(5,2), default=0.0)
    automation_coverage_percent = Column(DECIMAL(5,2), default=0.0)
    escaped_bugs = Column(Integer, default=0)
    test_coverage_percent = Column(DECIMAL(5,2), default=0.0)
    testcases_per_bug = Column(DECIMAL(5,2), default=0.0)
    bugs_per_100_tests = Column(DECIMAL(5,2), default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    sub_pnl = relationship("SubPnL", back_populates="sub_pnl_metrics")

# Sub-PnL detail level metrics (Detail page level) - Historical/Versioned
class SubPnLDetailMetrics(Base):
    __tablename__ = "sub_pnl_detail_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    sub_pnl_id = Column(Integer, ForeignKey("sub_pnls.id", ondelete="CASCADE"), nullable=False)
    features_shipped = Column(Integer, default=0)
    total_testcases_executed = Column(Integer, default=0)
    total_bugs_logged = Column(Integer, default=0)
    testcase_peer_review = Column(Integer, default=0)
    regression_bugs_found = Column(Integer, default=0)
    sanity_time_avg_hours = Column(DECIMAL(5,2), default=0.0)
    api_test_time_avg_hours = Column(DECIMAL(5,2), default=0.0)
    automation_coverage_percent = Column(DECIMAL(5,2), default=0.0)
    escaped_bugs = Column(Integer, default=0)
    
    # Calculated fields
    test_coverage_percent = Column(DECIMAL(5,2), default=0.0)
    testcases_per_bug = Column(DECIMAL(5,2), default=0.0)
    bugs_per_100_tests = Column(DECIMAL(5,2), default=0.0)
    
    # Versioning and metadata
    version = Column(Integer, default=1)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    sub_pnl = relationship("SubPnL", back_populates="sub_pnl_detail_metrics")

# Metrics History Table - tracks historical changes to all metrics
class MetricsHistory(Base):
    __tablename__ = "metrics_history"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reference fields
    entity_type = Column(String(50), nullable=False)  # 'sub_pnl', 'sub_pnl_detail'
    entity_id = Column(Integer, nullable=False)  # References the specific entity
    
    # Snapshot of metrics at time of change
    metrics_data = Column(Text, nullable=False)  # JSON string of all metrics
    
    # Change tracking
    change_type = Column(String(20), nullable=False)  # 'create', 'update', 'delete'
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # User who made the change
    change_description = Column(String(500), nullable=True)
    
    # Previous values for comparison
    previous_values = Column(Text, nullable=True)  # JSON string of changed fields only
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")