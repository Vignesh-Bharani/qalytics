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
    user_id = decode_token(token)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    return user

def convert_decimals_to_float(data):
    """Convert Decimal values to float for JSON serialization"""
    if isinstance(data, dict):
        return {key: convert_decimals_to_float(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_float(item) for item in data]
    elif hasattr(data, '__float__'):  # This includes Decimal
        return float(data)
    else:
        return data

def create_metrics_history(db: Session, entity_type: str, entity_id: int, 
                          metrics_data: dict, change_type: str = "update", 
                          user_id: int = None, description: str = None,
                          previous_values: dict = None):
    """Helper function to create metrics history record"""
    try:
        # Convert Decimals to floats for JSON serialization
        metrics_data_serializable = convert_decimals_to_float(metrics_data)
        previous_values_serializable = convert_decimals_to_float(previous_values) if previous_values else None
        
        history_record = models.MetricsHistory(
            entity_type=entity_type,
            entity_id=entity_id,
            metrics_data=json.dumps(metrics_data_serializable),
            change_type=change_type,
            changed_by=user_id,
            change_description=description,
            previous_values=json.dumps(previous_values_serializable) if previous_values_serializable else None
        )
        db.add(history_record)
        return history_record
    except Exception as e:
        raise e

def update_pnl_aggregated_metrics(db: Session, pnl_id: int):
    """Helper function to recalculate and update PnL metrics from Sub-PnLs"""
    try:
        # Get all Sub-PnLs for this PnL with their metrics
        sub_pnls_with_metrics = db.query(models.SubPnL).filter(
            models.SubPnL.pnl_id == pnl_id
        ).options(joinedload(models.SubPnL.sub_pnl_metrics)).all()
        
        # Aggregate metrics from Sub-PnL metrics (not detail metrics)
        total_features = sum([sub_pnl.sub_pnl_metrics[0].features_shipped if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_testcases = sum([sub_pnl.sub_pnl_metrics[0].total_testcases_executed if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_bugs = sum([sub_pnl.sub_pnl_metrics[0].total_bugs_logged if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_regression_bugs = sum([sub_pnl.sub_pnl_metrics[0].regression_bugs_found if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_escaped_bugs = sum([sub_pnl.sub_pnl_metrics[0].escaped_bugs if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        
        # Calculate averages for percentage-based metrics
        sub_pnl_count = len([sub_pnl for sub_pnl in sub_pnls_with_metrics if sub_pnl.sub_pnl_metrics])
        avg_sanity_time = sum([sub_pnl.sub_pnl_metrics[0].sanity_time_avg_hours if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics]) / max(sub_pnl_count, 1)
        avg_automation = sum([sub_pnl.sub_pnl_metrics[0].automation_coverage_percent if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics]) / max(sub_pnl_count, 1)
        avg_test_coverage = sum([sub_pnl.sub_pnl_metrics[0].test_coverage_percent if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics]) / max(sub_pnl_count, 1)
        
        # Calculate derived metrics
        avg_testcases_per_bug = (total_testcases / max(total_bugs, 1)) if total_bugs > 0 else 0
        avg_bugs_per_100_tests = (total_bugs * 100 / max(total_testcases, 1)) if total_testcases > 0 else 0
        
        # Get or create PnL metrics
        pnl_metrics = db.query(models.PnLMetrics).filter(
            models.PnLMetrics.pnl_id == pnl_id
        ).first()
        
        if pnl_metrics:
            # Update existing metrics
            pnl_metrics.features_shipped = total_features
            pnl_metrics.total_testcases_executed = total_testcases
            pnl_metrics.total_bugs_logged = total_bugs
            pnl_metrics.regression_bugs_found = total_regression_bugs
            pnl_metrics.escaped_bugs = total_escaped_bugs
            pnl_metrics.sanity_time_avg_hours = avg_sanity_time
            pnl_metrics.automation_coverage_percent = avg_automation
            pnl_metrics.test_coverage_percent = avg_test_coverage
            pnl_metrics.testcases_per_bug = avg_testcases_per_bug
            pnl_metrics.bugs_per_100_tests = avg_bugs_per_100_tests
        else:
            # Create new metrics
            pnl_metrics = models.PnLMetrics(
                pnl_id=pnl_id,
                features_shipped=total_features,
                total_testcases_executed=total_testcases,
                total_bugs_logged=total_bugs,
                regression_bugs_found=total_regression_bugs,
                escaped_bugs=total_escaped_bugs,
                sanity_time_avg_hours=avg_sanity_time,
                automation_coverage_percent=avg_automation,
                test_coverage_percent=avg_test_coverage,
                testcases_per_bug=avg_testcases_per_bug,
                bugs_per_100_tests=avg_bugs_per_100_tests
            )
            db.add(pnl_metrics)
        
        db.commit()
        return pnl_metrics
    except Exception as e:
        db.rollback()
        raise e

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

# Dashboard endpoint - PnL list with sub-PnL counts and metrics
@app.get("/dashboard", response_model=List[schemas.PnLWithMetrics])
def get_dashboard(db: Session = Depends(get_db)):
    """Dashboard showing PnLs with their sub-PnL counts and aggregated metrics"""
    pnls = db.query(models.PnL).options(
        joinedload(models.PnL.sub_pnls),
        joinedload(models.PnL.pnl_metrics)
    ).all()
    
    result = []
    for pnl in pnls:
        # Always recalculate metrics from Sub-PnLs to ensure they're up-to-date
        sub_pnls_with_metrics = db.query(models.SubPnL).filter(
            models.SubPnL.pnl_id == pnl.id
        ).options(joinedload(models.SubPnL.sub_pnl_metrics)).all()
        
        # Aggregate metrics from Sub-PnL metrics (not detail metrics)
        total_features = sum([sub_pnl.sub_pnl_metrics[0].features_shipped if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_testcases = sum([sub_pnl.sub_pnl_metrics[0].total_testcases_executed if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_bugs = sum([sub_pnl.sub_pnl_metrics[0].total_bugs_logged if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_regression_bugs = sum([sub_pnl.sub_pnl_metrics[0].regression_bugs_found if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        total_escaped_bugs = sum([sub_pnl.sub_pnl_metrics[0].escaped_bugs if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics])
        
        # Calculate averages for percentage-based metrics
        sub_pnl_count = len([sub_pnl for sub_pnl in sub_pnls_with_metrics if sub_pnl.sub_pnl_metrics])
        avg_sanity_time = sum([sub_pnl.sub_pnl_metrics[0].sanity_time_avg_hours if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics]) / max(sub_pnl_count, 1)
        avg_automation = sum([sub_pnl.sub_pnl_metrics[0].automation_coverage_percent if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics]) / max(sub_pnl_count, 1)
        avg_test_coverage = sum([sub_pnl.sub_pnl_metrics[0].test_coverage_percent if sub_pnl.sub_pnl_metrics else 0 for sub_pnl in sub_pnls_with_metrics]) / max(sub_pnl_count, 1)
        
        # Update existing metrics or create new ones
        metrics = pnl.pnl_metrics[0] if pnl.pnl_metrics else None
        if metrics:
            # Update existing metrics with aggregated values
            metrics.features_shipped = total_features
            metrics.total_testcases_executed = total_testcases
            metrics.total_bugs_logged = total_bugs
            metrics.regression_bugs_found = total_regression_bugs
            metrics.escaped_bugs = total_escaped_bugs
            metrics.sanity_time_avg_hours = avg_sanity_time
            metrics.automation_coverage_percent = avg_automation
            metrics.test_coverage_percent = avg_test_coverage
        else:
            # Create new metrics with aggregated values
            metrics = models.PnLMetrics(
                pnl_id=pnl.id,
                features_shipped=total_features,
                total_testcases_executed=total_testcases,
                total_bugs_logged=total_bugs,
                regression_bugs_found=total_regression_bugs,
                escaped_bugs=total_escaped_bugs,
                sanity_time_avg_hours=avg_sanity_time,
                automation_coverage_percent=avg_automation,
                test_coverage_percent=avg_test_coverage
            )
            db.add(metrics)
        
        # Commit changes to ensure metrics are saved
        db.commit()
        if not pnl.pnl_metrics:
            db.refresh(metrics)
        
        result.append(schemas.PnLWithMetrics(
            id=pnl.id,
            name=pnl.name,
            description=pnl.description,
            created_at=pnl.created_at,
            updated_at=pnl.updated_at,
            sub_pnls_count=len(pnl.sub_pnls),
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
    
    return db_pnl

@app.get("/pnls/{pnl_id}", response_model=schemas.PnLOut)
def get_pnl(pnl_id: int, db: Session = Depends(get_db)):
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    return pnl

# PnL Metrics endpoints
@app.get("/pnls/{pnl_id}/metrics", response_model=schemas.PnLMetricsOut)
def get_pnl_metrics(pnl_id: int, db: Session = Depends(get_db)):
    """Get PnL metrics - always recalculated from latest Sub-PnL metrics"""
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    
    # Always recalculate metrics from Sub-PnLs to ensure they're up-to-date
    metrics = update_pnl_aggregated_metrics(db, pnl_id)
    
    return metrics

@app.put("/pnls/{pnl_id}/metrics", response_model=schemas.PnLMetricsOut)
def update_pnl_metrics(
    pnl_id: int, 
    metrics_data: schemas.PnLMetricsUpdate, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update PnL metrics manually"""
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
            key: getattr(existing_metrics, key) 
            for key in metrics_data.dict().keys()
        }
        
        for key, value in metrics_data.dict().items():
            setattr(existing_metrics, key, value)
        
        # Create history record
        create_metrics_history(
            db=db,
            entity_type="pnl",
            entity_id=pnl_id,
            metrics_data=metrics_data.dict(),
            change_type="update",
            user_id=current_user.id,
            description=f"Updated metrics for {pnl.name}",
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
            user_id=current_user.id,
            description=f"Created metrics for {pnl.name}"
        )
        
        db.commit()
        db.refresh(new_metrics)
        return new_metrics

# Sub PnL endpoints  
@app.get("/pnls/{pnl_id}/sub-pnls", response_model=List[schemas.SubPnLWithDetailMetrics])
def list_sub_pnls(pnl_id: int, db: Session = Depends(get_db)):
    """List Sub PnLs under a PnL with their detailed metrics"""
    # Verify PnL exists
    pnl = db.query(models.PnL).filter(models.PnL.id == pnl_id).first()
    if not pnl:
        raise HTTPException(status_code=404, detail="PnL not found")
    
    sub_pnls = db.query(models.SubPnL).filter(
        models.SubPnL.pnl_id == pnl_id
    ).options(joinedload(models.SubPnL.sub_pnl_detail_metrics)).all()
    
    result = []
    for sub_pnl in sub_pnls:
        # Get or create detail metrics for this sub PnL
        detail_metrics = sub_pnl.sub_pnl_detail_metrics[0] if sub_pnl.sub_pnl_detail_metrics else None
        if not detail_metrics:
            detail_metrics = models.SubPnLDetailMetrics(sub_pnl_id=sub_pnl.id)
            db.add(detail_metrics)
            db.commit()
            db.refresh(detail_metrics)
        
        result.append(schemas.SubPnLWithDetailMetrics(
            id=sub_pnl.id,
            name=sub_pnl.name,
            description=sub_pnl.description,
            pnl_id=sub_pnl.pnl_id,
            created_at=sub_pnl.created_at,
            updated_at=sub_pnl.updated_at,
            detail_metrics=detail_metrics
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
    
    # Create default metrics for sub-PnL
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
        
        # Update parent PnL aggregated metrics
        update_pnl_aggregated_metrics(db, sub_pnl.pnl_id)
        
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
        
        # Update parent PnL aggregated metrics
        update_pnl_aggregated_metrics(db, sub_pnl.pnl_id)
        
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify sub PnL exists
    sub_pnl = db.query(models.SubPnL).filter(models.SubPnL.id == sub_pnl_id).first()
    if not sub_pnl:
        raise HTTPException(status_code=404, detail="Sub PnL not found")
    
    # Get existing metrics for history tracking
    existing_metrics = db.query(models.SubPnLDetailMetrics).filter(
        models.SubPnLDetailMetrics.sub_pnl_id == sub_pnl_id
    ).first()
    
    # Prepare new metrics data
    new_data = metrics_data.model_dump()
    
    if existing_metrics:
        # Store previous values for history
        previous_values = {
            key: getattr(existing_metrics, key) 
            for key in new_data.keys() 
            if hasattr(existing_metrics, key)
        }
        
        # Update existing metrics
        for key, value in new_data.items():
            setattr(existing_metrics, key, value)
        
        # Create history record
        try:
            history_record = create_metrics_history(
                db=db,
                entity_type="sub_pnl_detail",
                entity_id=sub_pnl_id,
                metrics_data=new_data,
                change_type="update",
                user_id=current_user.id,
                description=f"Updated detailed metrics for {sub_pnl.name}",
                previous_values=previous_values
            )
        except Exception as e:
            # Don't fail the whole request if history fails
            pass
        
        db.commit()
        db.refresh(existing_metrics)
        
        return existing_metrics
    else:
        # Create new metrics
        new_metrics = models.SubPnLDetailMetrics(sub_pnl_id=sub_pnl_id, **new_data)
        db.add(new_metrics)
        
        # Create history record
        try:
            history_record = create_metrics_history(
                db=db,
                entity_type="sub_pnl_detail",
                entity_id=sub_pnl_id,
                metrics_data=new_data,
                change_type="create",
                user_id=current_user.id,
                description=f"Created detailed metrics for {sub_pnl.name}"
            )
        except Exception as e:
            # Don't fail the whole request if history fails
            pass
        
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

@app.delete("/metrics-history/{history_id}")
def delete_metrics_history(history_id: int, db: Session = Depends(get_db)):
    """Delete a specific metrics history entry and restore latest metrics if it was the latest"""
    # Get the history entry to delete
    history_entry = db.query(models.MetricsHistory).filter(
        models.MetricsHistory.id == history_id
    ).first()
    
    if not history_entry:
        raise HTTPException(status_code=404, detail="Metrics history entry not found")
    
    entity_type = history_entry.entity_type
    entity_id = history_entry.entity_id
    
    # Check if this is the latest entry for this entity
    latest_history = db.query(models.MetricsHistory).filter(
        models.MetricsHistory.entity_type == entity_type,
        models.MetricsHistory.entity_id == entity_id
    ).order_by(models.MetricsHistory.created_at.desc()).first()
    
    is_latest = (latest_history and latest_history.id == history_id)
    
    # Delete the history entry
    db.delete(history_entry)
    db.commit()
    
    # If we deleted the latest entry, restore the next latest metrics
    if is_latest:
        # Get the new latest history entry after deletion
        new_latest_history = db.query(models.MetricsHistory).filter(
            models.MetricsHistory.entity_type == entity_type,
            models.MetricsHistory.entity_id == entity_id
        ).order_by(models.MetricsHistory.created_at.desc()).first()
        
        if new_latest_history:
            # Restore metrics from the new latest history
            metrics_data = json.loads(new_latest_history.metrics_data)
            
            if entity_type == "sub_pnl":
                # Update Sub-PnL metrics
                sub_pnl_metrics = db.query(models.SubPnLMetrics).filter(
                    models.SubPnLMetrics.sub_pnl_id == entity_id
                ).first()
                if sub_pnl_metrics:
                    for key, value in metrics_data.items():
                        if hasattr(sub_pnl_metrics, key):
                            setattr(sub_pnl_metrics, key, value)
                    db.commit()
            
            elif entity_type == "sub_pnl_detail":
                # Update Sub-PnL detail metrics
                detail_metrics = db.query(models.SubPnLDetailMetrics).filter(
                    models.SubPnLDetailMetrics.sub_pnl_id == entity_id
                ).first()
                if detail_metrics:
                    for key, value in metrics_data.items():
                        if hasattr(detail_metrics, key):
                            setattr(detail_metrics, key, value)
                    db.commit()
        else:
            # No history left, reset to default values
            if entity_type == "sub_pnl":
                sub_pnl_metrics = db.query(models.SubPnLMetrics).filter(
                    models.SubPnLMetrics.sub_pnl_id == entity_id
                ).first()
                if sub_pnl_metrics:
                    # Reset to default values
                    sub_pnl_metrics.features_shipped = 0
                    sub_pnl_metrics.total_testcases_executed = 0
                    sub_pnl_metrics.total_bugs_logged = 0
                    sub_pnl_metrics.regression_bugs_found = 0
                    sub_pnl_metrics.sanity_time_avg_hours = 0.0
                    sub_pnl_metrics.automation_coverage_percent = 0.0
                    sub_pnl_metrics.escaped_bugs = 0
                    sub_pnl_metrics.test_coverage_percent = 0.0
                    sub_pnl_metrics.testcases_per_bug = 0.0
                    sub_pnl_metrics.bugs_per_100_tests = 0.0
                    db.commit()
            
            elif entity_type == "sub_pnl_detail":
                detail_metrics = db.query(models.SubPnLDetailMetrics).filter(
                    models.SubPnLDetailMetrics.sub_pnl_id == entity_id
                ).first()
                if detail_metrics:
                    # Reset to default values
                    detail_metrics.features_shipped = 0
                    detail_metrics.total_testcases_executed = 0
                    detail_metrics.total_bugs_logged = 0
                    detail_metrics.testcase_peer_review = 0
                    detail_metrics.regression_bugs_found = 0
                    detail_metrics.sanity_time_avg_hours = 0.0
                    detail_metrics.api_test_time_avg_hours = 0.0
                    detail_metrics.automation_coverage_percent = 0.0
                    detail_metrics.escaped_bugs = 0
                    detail_metrics.test_coverage_percent = 0.0
                    detail_metrics.testcases_per_bug = 0.0
                    detail_metrics.bugs_per_100_tests = 0.0
                    db.commit()
    
    return {"message": "Metrics history deleted successfully", "restored_latest": is_latest}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)