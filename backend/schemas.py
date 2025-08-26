from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# PnL schemas
class PnLBase(BaseModel):
    name: str
    description: Optional[str] = None

class PnLCreate(PnLBase):
    pass

class PnLOut(PnLBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Sub PnL schemas  
class SubPnLBase(BaseModel):
    name: str
    description: Optional[str] = None

class SubPnLCreate(SubPnLBase):
    pass

class SubPnLOut(SubPnLBase):
    id: int
    pnl_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# PnL Metrics schemas  
class PnLMetricsBase(BaseModel):
    features_shipped: int = 0
    total_testcases_executed: int = 0
    total_bugs_logged: int = 0
    testcase_peer_review: int = 0
    regression_bugs_found: int = 0
    sanity_time_avg_hours: float = 0.0
    api_test_time_avg_hours: float = 0.0
    automation_coverage_percent: float = 0.0
    escaped_bugs: int = 0

class PnLMetricsCreate(PnLMetricsBase):
    pass

class PnLMetricsUpdate(PnLMetricsBase):
    pass

class PnLMetricsOut(PnLMetricsBase):
    id: int
    pnl_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Sub PnL Metrics schemas
class SubPnLMetricsBase(BaseModel):
    features_shipped: int = 0
    total_testcases_executed: int = 0
    total_bugs_logged: int = 0
    regression_bugs_found: int = 0
    sanity_time_avg_hours: float = 0.0
    automation_coverage_percent: float = 0.0
    escaped_bugs: int = 0

class SubPnLMetricsCreate(SubPnLMetricsBase):
    pass

class SubPnLMetricsUpdate(SubPnLMetricsBase):
    pass

class SubPnLMetricsOut(SubPnLMetricsBase):
    id: int
    sub_pnl_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Sub PnL Detail Metrics schemas
class SubPnLDetailMetricsBase(BaseModel):
    features_shipped: int = 0
    total_testcases_executed: int = 0
    total_bugs_logged: int = 0
    testcase_peer_review: int = 0
    regression_bugs_found: int = 0
    sanity_time_avg_hours: float = 0.0
    api_test_time_avg_hours: float = 0.0
    automation_coverage_percent: float = 0.0
    escaped_bugs: int = 0

class SubPnLDetailMetricsCreate(SubPnLDetailMetricsBase):
    pass

class SubPnLDetailMetricsUpdate(SubPnLDetailMetricsBase):
    pass

class SubPnLDetailMetricsOut(SubPnLDetailMetricsBase):
    id: int
    sub_pnl_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard response schemas
class PnLWithSubPnLs(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sub_pnls_count: int = 0
    
    class Config:
        from_attributes = True

class PnLWithMetrics(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sub_pnls_count: int = 0
    metrics: Optional[PnLMetricsOut] = None
    
    class Config:
        from_attributes = True

class SubPnLWithMetrics(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    pnl_id: int
    created_at: datetime
    updated_at: datetime
    metrics: Optional[SubPnLMetricsOut] = None
    
    class Config:
        from_attributes = True

class SubPnLWithDetailMetrics(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    pnl_id: int
    created_at: datetime
    updated_at: datetime
    detail_metrics: Optional[SubPnLDetailMetricsOut] = None
    
    class Config:
        from_attributes = True

# Metrics History schemas
class MetricsHistoryBase(BaseModel):
    entity_type: str
    entity_id: int
    metrics_data: str
    change_type: str
    change_description: Optional[str] = None
    previous_values: Optional[str] = None

class MetricsHistoryCreate(MetricsHistoryBase):
    changed_by: Optional[int] = None

class MetricsHistoryOut(MetricsHistoryBase):
    id: int
    changed_by: Optional[int] = None
    created_at: datetime
    user: Optional[UserOut] = None
    
    class Config:
        from_attributes = True