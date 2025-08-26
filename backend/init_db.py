#!/usr/bin/env python3
"""
Database initialization script for QAlytics
Creates tables and adds sample data
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import engine, get_db
import models
import schemas
from security import hash_password
from datetime import datetime
import json

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

def create_sample_data():
    """Create sample data for testing"""
    print("Creating sample data...")
    
    db = next(get_db())
    
    try:
        # Create admin user
        admin_user = models.User(
            email="test@qalytics.com",
            password_hash=hash_password("password123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("✅ Admin user created: test@qalytics.com / password123")
        
        # Create PnLs with Sub-PnLs and metrics
        pnls_data = [
            {
                "name": "ePharmacy",
                "description": "Online pharmacy platform with order management, inventory, and delivery systems",
                "sub_pnls": [
                    {"name": "Logistics", "description": "Order fulfillment and delivery management"},
                    {"name": "Warehouse", "description": "Inventory management and stock control"},
                    {"name": "Audit App", "description": "Compliance and audit tracking"},
                    {"name": "Finance", "description": "Payment processing and financial reporting"}
                ]
            },
            {
                "name": "eDiagnostics", 
                "description": "Digital diagnostics platform with lab management and reporting",
                "sub_pnls": [
                    {"name": "Lab Management", "description": "Laboratory operations and test scheduling"},
                    {"name": "Report Generation", "description": "Automated report creation and delivery"},
                    {"name": "Patient Portal", "description": "Patient access and communication platform"}
                ]
            },
            {
                "name": "Telemedicine",
                "description": "Video consultation platform with appointment scheduling",
                "sub_pnls": [
                    {"name": "Video Platform", "description": "Video calling and consultation system"},
                    {"name": "Appointment System", "description": "Scheduling and calendar management"},
                    {"name": "Prescription Module", "description": "Digital prescription and pharmacy integration"}
                ]
            }
        ]
        
        for pnl_data in pnls_data:
            # Create PnL
            pnl = models.PnL(
                name=pnl_data["name"],
                description=pnl_data["description"]
            )
            db.add(pnl)
            db.commit()
            db.refresh(pnl)
            
            # Create PnL metrics
            pnl_metrics = models.PnLMetrics(
                pnl_id=pnl.id,
                features_shipped=15,
                total_testcases_executed=500,
                total_bugs_logged=25,
                testcase_peer_review=10,
                regression_bugs_found=5,
                sanity_time_avg_hours=2.5,
                api_test_time_avg_hours=1.5,
                automation_coverage_percent=75.0,
                escaped_bugs=2,
                test_coverage_percent=85.0,
                testcases_per_bug=20.0,
                bugs_per_100_tests=5.0
            )
            db.add(pnl_metrics)
            
            # Create Sub-PnLs
            for i, sub_pnl_data in enumerate(pnl_data["sub_pnls"]):
                sub_pnl = models.SubPnL(
                    pnl_id=pnl.id,
                    name=sub_pnl_data["name"],
                    description=sub_pnl_data["description"]
                )
                db.add(sub_pnl)
                db.commit()
                db.refresh(sub_pnl)
                
                # Create Sub-PnL basic metrics
                sub_pnl_metrics = models.SubPnLMetrics(
                    sub_pnl_id=sub_pnl.id,
                    features_shipped=5 + i * 2,
                    total_testcases_executed=100 + i * 50,
                    total_bugs_logged=8 + i * 3,
                    regression_bugs_found=2 + i,
                    sanity_time_avg_hours=2.0 + i * 0.5,
                    automation_coverage_percent=60.0 + i * 10,
                    escaped_bugs=1 + i,
                    test_coverage_percent=70.0 + i * 5,
                    testcases_per_bug=12.5 + i * 2.5,
                    bugs_per_100_tests=8.0 - i
                )
                db.add(sub_pnl_metrics)
                
                # Create Sub-PnL detailed metrics (this is what we'll use for display)
                sub_pnl_detail_metrics = models.SubPnLDetailMetrics(
                    sub_pnl_id=sub_pnl.id,
                    features_shipped=14 if sub_pnl_data["name"] == "Logistics" else 8 + i * 2,  # Set Logistics to 14 as mentioned
                    total_testcases_executed=180 if sub_pnl_data["name"] == "Logistics" else 100 + i * 20,
                    total_bugs_logged=15 if sub_pnl_data["name"] == "Logistics" else 10 + i * 2,
                    testcase_peer_review=3 + i,
                    regression_bugs_found=4 if sub_pnl_data["name"] == "Logistics" else 2 + i,
                    sanity_time_avg_hours=2.5 if sub_pnl_data["name"] == "Logistics" else 2.0 + i * 0.3,
                    api_test_time_avg_hours=1.0 + i * 0.2,
                    automation_coverage_percent=70.0 if sub_pnl_data["name"] == "Logistics" else 50.0 + i * 15,
                    escaped_bugs=2 if sub_pnl_data["name"] == "Logistics" else 1 + i,
                    test_coverage_percent=80.0 + i * 3,
                    testcases_per_bug=15.0 + i * 2,
                    bugs_per_100_tests=6.0 - i * 0.5,
                    version=1,
                    is_active=True
                )
                db.add(sub_pnl_detail_metrics)
        
        db.commit()
        print("✅ Sample PnLs, Sub-PnLs, and metrics created successfully!")
        print(f"   - Created {len(pnls_data)} PnLs")
        print(f"   - Created {sum(len(pnl['sub_pnls']) for pnl in pnls_data)} Sub-PnLs")
        print("   - Created metrics for all entities")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    print("🚀 Initializing QAlytics Database...")
    print("=" * 50)
    
    try:
        create_tables()
        create_sample_data()
        
        print("=" * 50)
        print("✅ Database initialization completed successfully!")
        print("\n🔑 Login Credentials:")
        print("   Email: test@qalytics.com")
        print("   Password: password123")
        print("   Role: admin")
        print("\n🌐 Access the application:")
        print("   Frontend: http://localhost:3000")
        print("   Backend API: http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()