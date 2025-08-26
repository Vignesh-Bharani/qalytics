from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import json
import models
import schemas
from database import get_db, engine
from security import hash_password, verify_password, create_token, decode_token

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QAlytics API",
    description="Quality Analytics and Metrics Platform - Hierarchical PnL Management",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get current user
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    user_data = decode_token(token)
    
    user = db.query(models.User).filter(models.User.id == user_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    return user

def create_metrics_history(db: Session, entity_type: str, entity_id: int, 
                          metrics_data: dict, change_type: str = "update", 
                          user_id: int = None, description: str = None,
                          previous_values: dict = None):
    """Helper function to create metrics history record"""
    history_record = models.MetricsHistory(
        entity_type=entity_type,
        entity_id=entity_id,
        metrics_data=json.dumps(metrics_data),
        change_type=change_type,
        changed_by=user_id,
        change_description=description,
        previous_values=json.dumps(previous_values) if previous_values else None
    )
    db.add(history_record)
    return history_record

@app.get("/")
def root():
    return {"message": "QAlytics API v2.0 - Hierarchical PnL Quality Analytics Platform"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Authentication endpoints
@app.post("/auth/signup", response_model=schemas.UserOut)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    db_user = models.User(
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=schemas.TokenOut)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = create_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

# Dashboard endpoint - PnL list with metrics
@app.get("/dashboard", response_model=List[schemas.PnLWithMetrics])
def get_dashboard(db: Session = Depends(get_db)):
    """Dashboard showing PnLs with their KPIs"""
    pnls = db.query(models.PnL).options(
        joinedload(models.PnL.pnl_metrics)
    ).all()
    
    result = []
    for pnl in pnls:
        # Get or create metrics for this PnL
        metrics = pnl.pnl_metrics[0] if pnl.pnl_metrics else None
        if not metrics:
            metrics = models.PnLMetrics(pnl_id=pnl.id)
            db.add(metrics)
            db.commit()
            db.refresh(metrics)
        
        result.append(schemas.PnLWithMetrics(
            id=pnl.id,
            name=pnl.name,
            description=pnl.description,
            created_at=pnl.created_at,
            updated_at=pnl.updated_at,
            metrics=metrics
        ))
    
    return result

# PnL endpoints
@app.get("/pnls", response_model=List[schemas.PnLOut])
def list_pnls(db: Session = Depends(get_db)):
    return db.query(models.PnL).all()

@app.post("/pnls", response_model=schemas.PnLOut)
def create_pnl(pnl_data: schemas.PnLCreate, db: Session = Depends(get_db)):
    db_pnl = models.PnL(**pnl_data.dict())
    db.add(db_pnl)
    db.commit()
    db.refresh(db_pnl)
    
    # Create default metrics
    metrics = models.PnLMetrics(pnl_id=db_pnl.id)
    db.add(metrics)
    db.commit()
    
    return db_pnl

@app.get("/pnls/{pnl_id}", response_model=schemas.PnLOut)
def get_pnl(pnl_id: int, db: Session = Depends(get_db)):
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    return pnl

# Sub PnL endpoints  
@app.get("/pnls/{pnl_id}/sub-pnls", response_model=List[schemas.SubPnLWithMetrics])
def list_sub_pnls(pnl_id: int, db: Session = Depends(get_db)):
    """List Sub PnLs under a PnL with their metrics"""
    # Verify PnL exists
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    
    sub_pnls = db.query(models.SubPnL).filter(
        models.SubPnL.pnl_id == pnl_id
    ).options(joinedload(models.SubPnL.sub_pnl_metrics)).all()
    
    result = []
    for sub_pnl in sub_pnls:
        # Get or create metrics for this sub PnL
        metrics = sub_pnl.sub_pnl_metrics[0] if sub_pnl.sub_pnl_metrics else None
        if not metrics:
            metrics = models.SubPnLMetrics(sub_pnl_id=sub_pnl.id)
            db.add(metrics)
            db.commit()
            db.refresh(metrics)
        
        result.append(schemas.SubPnLWithMetrics(
            id=sub_pnl.id,
            name=sub_pnl.name,
            description=sub_pnl.description,
            pnl_id=sub_pnl.pnl_id,
            created_at=sub_pnl.created_at,
            updated_at=sub_pnl.updated_at,
            metrics=metrics
        ))
    
    return result

@app.post("/pnls/{pnl_id}/sub-pnls", response_model=schemas.SubPnLOut)
def create_sub_pnl(pnl_id: int, sub_pnl_data: schemas.SubPnLCreate, db: Session = Depends(get_db)):
    # Verify PnL exists
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    
    db_sub_pnl = models.SubPnL(
        pnl_id=pnl_id,
        **sub_pnl_data.dict()
    )
    db.add(db_sub_pnl)
    db.commit()
    db.refresh(db_sub_pnl)
    
    # Create default metrics
    metrics = models.SubPnLMetrics(sub_pnl_id=db_sub_pnl.id)
    db.add(metrics)
    detail_metrics = models.SubPnLDetailMetrics(sub_pnl_id=db_sub_pnl.id)
    db.add(detail_metrics)
    db.commit()
    
    return db_sub_pnl

@app.get("/sub-pnls/{sub_pnl_id}", response_model=schemas.SubPnLWithDetailMetrics)
def get_sub_pnl_details(sub_pnl_id: int, db: Session = Depends(get_db)):
    """Get Sub PnL with detailed metrics"""
    sub_pnl = db.query(models.SubPnL).filter(models.SubPnL.id == sub_pnl_id).first()
    if not sub_pnl:
        raise HTTPException(status_code=404, detail="Sub PnL not found")
    
    # Get or create detail metrics
    detail_metrics = db.query(models.SubPnLDetailMetrics).filter(
        models.SubPnLDetailMetrics.sub_pnl_id == sub_pnl_id
    ).first()
    
    if not detail_metrics:
        detail_metrics = models.SubPnLDetailMetrics(sub_pnl_id=sub_pnl_id)
        db.add(detail_metrics)
        db.commit()
        db.refresh(detail_metrics)
    
    return schemas.SubPnLWithDetailMetrics(
        id=sub_pnl.id,
        name=sub_pnl.name,
        description=sub_pnl.description,
        pnl_id=sub_pnl.pnl_id,
        created_at=sub_pnl.created_at,
        updated_at=sub_pnl.updated_at,
        detail_metrics=detail_metrics
    )

# PnL Metrics endpoints
@app.get("/pnls/{pnl_id}/metrics", response_model=schemas.PnLMetricsOut)
def get_pnl_metrics(pnl_id: int, db: Session = Depends(get_db)):
    metrics = db.query(models.PnLMetrics).filter(
        models.PnLMetrics.pnl_id == pnl_id
    ).first()

    if not metrics:
        # Create default metrics if none exist
        metrics = models.PnLMetrics(pnl_id=pnl_id)
        db.add(metrics)
        db.commit()
        db.refresh(metrics)

    return metrics

@app.put("/pnls/{pnl_id}/metrics", response_model=schemas.PnLMetricsOut)
def update_pnl_metrics(
    pnl_id: int,
    metrics_data: schemas.PnLMetricsUpdate,
    db: Session = Depends(get_db)
):
    # Verify PnL exists
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")

    # Update or create metrics
    existing_metrics = db.query(models.PnLMetrics).filter(
        models.PnLMetrics.pnl_id == pnl_id
    ).first()

    if existing_metrics:
        # Capture previous values for history
        previous_values = {
            field: getattr(existing_metrics, field) 
            for field in metrics_data.dict(exclude_unset=True).keys()
        }
        
        for field, value in metrics_data.dict(exclude_unset=True).items():
            setattr(existing_metrics, field, value)
        
        # Create history record
        create_metrics_history(
            db=db,
            entity_type="pnl",
            entity_id=pnl_id,
            metrics_data=metrics_data.dict(),
            change_type="update",
            description="PnL metrics updated",
            previous_values=previous_values
        )
        
        db.commit()
        db.refresh(existing_metrics)
        return existing_metrics
    else:
        new_metrics = models.PnLMetrics(pnl_id=pnl_id, **metrics_data.dict())
        db.add(new_metrics)
        db.flush()  # Get the ID before history
        
        # Create history record
        create_metrics_history(
            db=db,
            entity_type="pnl",
            entity_id=pnl_id,
            metrics_data=metrics_data.dict(),
            change_type="create",
            description="PnL metrics created"
        )
        
        db.commit()
        db.refresh(new_metrics)
        return new_metrics

# Sub PnL Metrics endpoints
@app.get("/sub-pnls/{sub_pnl_id}/metrics", response_model=schemas.SubPnLMetricsOut)
def get_sub_pnl_metrics(sub_pnl_id: int, db: Session = Depends(get_db)):
    metrics = db.query(models.SubPnLMetrics).filter(
        models.SubPnLMetrics.sub_pnl_id == sub_pnl_id
    ).first()
    
    if not metrics:
        # Create default metrics if none exist
        metrics = models.SubPnLMetrics(sub_pnl_id=sub_pnl_id)
        db.add(metrics)
        db.commit()
        db.refresh(metrics)
    
    return metrics

@app.put("/sub-pnls/{sub_pnl_id}/metrics", response_model=schemas.SubPnLMetricsOut)
def update_sub_pnl_metrics(
    sub_pnl_id: int, 
    metrics_data: schemas.SubPnLMetricsUpdate, 
    db: Session = Depends(get_db)
):
    # Verify sub PnL exists
    sub_pnl = db.query(models.SubPnL).filter(models.SubPnL.id == sub_pnl_id).first()
    if not sub_pnl:
        raise HTTPException(status_code=404, detail="Sub PnL not found")
    
    # Update or create metrics
    existing_metrics = db.query(models.SubPnLMetrics).filter(
        models.SubPnLMetrics.sub_pnl_id == sub_pnl_id
    ).first()
    
    if existing_metrics:
        # Capture previous values for history
        previous_values = {
            key: getattr(existing_metrics, key) 
            for key in metrics_data.dict().keys()
        }
        
        for key, value in metrics_data.dict().items():
            setattr(existing_metrics, key, value)
        
        # Create history record
        create_metrics_history(
            db=db,
            entity_type="sub_pnl",
            entity_id=sub_pnl_id,
            metrics_data=metrics_data.dict(),
            change_type="update",
            description="Sub-PnL metrics updated",
            previous_values=previous_values
        )
        
        db.commit()
        db.refresh(existing_metrics)
        return existing_metrics
    else:
        new_metrics = models.SubPnLMetrics(sub_pnl_id=sub_pnl_id, **metrics_data.dict())
        db.add(new_metrics)
        db.flush()  # Get the ID before history
        
        # Create history record
        create_metrics_history(
            db=db,
            entity_type="sub_pnl",
            entity_id=sub_pnl_id,
            metrics_data=metrics_data.dict(),
            change_type="create",
            description="Sub-PnL metrics created"
        )
        
        db.commit()
        db.refresh(new_metrics)
        return new_metrics

# Sub PnL Detail Metrics endpoints
@app.get("/sub-pnls/{sub_pnl_id}/detail-metrics", response_model=schemas.SubPnLDetailMetricsOut)
def get_sub_pnl_detail_metrics(sub_pnl_id: int, db: Session = Depends(get_db)):
    metrics = db.query(models.SubPnLDetailMetrics).filter(
        models.SubPnLDetailMetrics.sub_pnl_id == sub_pnl_id
    ).first()
    
    if not metrics:
        # Create default metrics if none exist
        metrics = models.SubPnLDetailMetrics(sub_pnl_id=sub_pnl_id)
        db.add(metrics)
        db.commit()
        db.refresh(metrics)
    
    return metrics

@app.put("/sub-pnls/{sub_pnl_id}/detail-metrics", response_model=schemas.SubPnLDetailMetricsOut)
def update_sub_pnl_detail_metrics(
    sub_pnl_id: int, 
    metrics_data: schemas.SubPnLDetailMetricsUpdate, 
    db: Session = Depends(get_db)
):
    # Verify sub PnL exists
    sub_pnl = db.query(models.SubPnL).filter(models.SubPnL.id == sub_pnl_id).first()
    if not sub_pnl:
        raise HTTPException(status_code=404, detail="Sub PnL not found")
    
    # Update or create detail metrics
    existing_metrics = db.query(models.SubPnLDetailMetrics).filter(
        models.SubPnLDetailMetrics.sub_pnl_id == sub_pnl_id
    ).first()
    
    if existing_metrics:
        for key, value in metrics_data.dict().items():
            setattr(existing_metrics, key, value)
        db.commit()
        db.refresh(existing_metrics)
        return existing_metrics
    else:
        new_metrics = models.SubPnLDetailMetrics(sub_pnl_id=sub_pnl_id, **metrics_data.dict())
        db.add(new_metrics)
        db.commit()
        db.refresh(new_metrics)
        return new_metrics

# Metrics History endpoints
@app.get("/metrics-history", response_model=List[schemas.MetricsHistoryOut])
def list_metrics_history(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get metrics history with optional filtering"""
    query = db.query(models.MetricsHistory).options(joinedload(models.MetricsHistory.user))
    
    if entity_type:
        query = query.filter(models.MetricsHistory.entity_type == entity_type)
    if entity_id:
        query = query.filter(models.MetricsHistory.entity_id == entity_id)
    
    history = query.order_by(models.MetricsHistory.created_at.desc()).limit(limit).all()
    return history

@app.get("/metrics-history/{history_id}", response_model=schemas.MetricsHistoryOut)
def get_metrics_history_item(history_id: int, db: Session = Depends(get_db)):
    """Get specific metrics history item"""
    history = db.query(models.MetricsHistory).options(joinedload(models.MetricsHistory.user)).filter(
        models.MetricsHistory.id == history_id
    ).first()
    
    if not history:
        raise HTTPException(status_code=404, detail="Metrics history not found")
    
    return history

@app.get("/pnls/{pnl_id}/metrics-history", response_model=List[schemas.MetricsHistoryOut])
def get_pnl_metrics_history(pnl_id: int, db: Session = Depends(get_db)):
    """Get metrics history for a specific PnL"""
    # Verify PnL exists
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    
    history = db.query(models.MetricsHistory).options(joinedload(models.MetricsHistory.user)).filter(
        models.MetricsHistory.entity_type == "pnl",
        models.MetricsHistory.entity_id == pnl_id
    ).order_by(models.MetricsHistory.created_at.desc()).all()
    
    return history

@app.get("/sub-pnls/{sub_pnl_id}/metrics-history", response_model=List[schemas.MetricsHistoryOut])
def get_sub_pnl_metrics_history(sub_pnl_id: int, db: Session = Depends(get_db)):
    """Get metrics history for a specific Sub-PnL"""
    # Verify Sub-PnL exists
    sub_pnl = db.query(models.SubPnL).filter(models.SubPnL.id == sub_pnl_id).first()
    if not sub_pnl:
        raise HTTPException(status_code=404, detail="Sub-PnL not found")
    
    history = db.query(models.MetricsHistory).options(joinedload(models.MetricsHistory.user)).filter(
        models.MetricsHistory.entity_type.in_(["sub_pnl", "sub_pnl_detail"]),
        models.MetricsHistory.entity_id == sub_pnl_id
    ).order_by(models.MetricsHistory.created_at.desc()).all()
    
    return history

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)