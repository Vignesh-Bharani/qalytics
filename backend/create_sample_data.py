#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from security import hash_password

def create_sample_data():
    """Create sample data according to the new QAlytics requirements"""
    db = SessionLocal()
    
    try:
        # Create tables
        models.Base.metadata.create_all(bind=engine)
        
        # Check if we already have data
        existing_user = db.query(models.User).first()
        if existing_user:
            print("Sample data already exists. Skipping...")
            return
        
        print("🌱 Creating sample data for QAlytics...")
        
        # Create a test user
        test_user = models.User(
            email="test@qalytics.com",
            password_hash=hash_password("password123"),
            role="admin"
        )
        db.add(test_user)
        db.flush()
        print("✅ Created test user: test@qalytics.com / password123")
        
        # Create Main PnLs
        main_pnls_data = [
            {
                "name": "ePharmacy",
                "description": "Online pharmacy platform with order management and delivery services"
            },
            {
                "name": "eDiagnostics", 
                "description": "Digital diagnostics platform with lab management and reporting"
            },
            {
                "name": "Telemedicine",
                "description": "Video consultation platform with appointment and prescription management"
            }
        ]
        
        created_pnls = []
        for pnl_data in main_pnls_data:
            pnl = models.PnL(**pnl_data)
            db.add(pnl)
            db.flush()
            created_pnls.append(pnl)

            # Create PnL Metrics
            pnl_metrics = models.PnLMetrics(
                pnl_id=pnl.id,
                total_testcases=850 + (pnl.id * 150),
                test_coverage_percent=78.5 + (pnl.id * 2.5),
                automation_percent=65.0 + (pnl.id * 5.0),
                lower_env_bugs=25 + (pnl.id * 5),
                prod_bugs=3 + pnl.id
            )
            db.add(pnl_metrics)
        
        # Create Sub PnLs for each Main PnL
        sub_pnls_data = {
            "ePharmacy": [
                {"name": "Logistics", "description": "Order fulfillment and delivery management"},
                {"name": "Warehouse", "description": "Inventory and stock management system"},
                {"name": "Audit App", "description": "Compliance and audit tracking application"},
                {"name": "Finance", "description": "Payment processing and financial reporting"}
            ],
            "eDiagnostics": [
                {"name": "Lab Management", "description": "Sample tracking and lab workflow"},
                {"name": "Report Generation", "description": "Automated report creation and delivery"},
                {"name": "Patient Portal", "description": "Patient access to test results and history"}
            ],
            "Telemedicine": [
                {"name": "Video Platform", "description": "Video call infrastructure and quality"},
                {"name": "Appointment System", "description": "Scheduling and calendar management"},
                {"name": "Prescription Module", "description": "Digital prescription and pharmacy integration"}
            ]
        }
        
        for pnl in created_pnls:
            sub_pnl_list = sub_pnls_data.get(pnl.name, [])

            for i, sub_pnl_data in enumerate(sub_pnl_list):
                sub_pnl = models.SubPnL(
                    pnl_id=pnl.id,
                    **sub_pnl_data
                )
                db.add(sub_pnl)
                db.flush()
                print(f"  📁 Created Sub PnL: {sub_pnl.name}")
                
                # Create Sub PnL Metrics
                sub_metrics = models.SubPnLMetrics(
                    sub_pnl_id=sub_pnl.id,
                    features_shipped=8 + (i * 2),
                    total_testcases_executed=180 + (i * 30),
                    total_bugs_logged=15 + (i * 3),
                    regression_bugs_found=4 + i,
                    sanity_time_avg_hours=2.5 + (i * 0.5),
                    automation_coverage_percent=70.0 + (i * 5.0),
                    escaped_bugs=2 + (i % 2)
                )
                db.add(sub_metrics)
                
                # Create Sub PnL Detail Metrics  
                detail_metrics = models.SubPnLDetailMetrics(
                    sub_pnl_id=sub_pnl.id,
                    features_shipped=8 + (i * 2),
                    total_testcases_executed=180 + (i * 30),
                    total_bugs_logged=15 + (i * 3),
                    testcase_peer_review=120 + (i * 20),
                    regression_bugs_found=4 + i,
                    sanity_time_avg_hours=2.5 + (i * 0.5),
                    api_test_time_avg_hours=1.8 + (i * 0.3),
                    automation_coverage_percent=70.0 + (i * 5.0),
                    escaped_bugs=2 + (i % 2)
                )
                db.add(detail_metrics)
        
        db.commit()
        print("🎉 Sample data created successfully!")
        print(f"📊 Created {len(created_pnls)} PnLs")
        print(f"📁 Created multiple Sub PnLs with metrics")
        print("\n🔑 Test Credentials:")
        print("   📧 Email: test@qalytics.com")
        print("   🔒 Password: password123")
        print("   👤 Role: admin")
        print("\n🚀 You can now login and explore the QAlytics dashboard!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()