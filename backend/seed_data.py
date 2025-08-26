#!/usr/bin/env python3
"""
Database seeding script for QAlytics
Creates sample data including a test user and demo data
"""
import sys
import os
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from database import engine
from models import User, PnL, Release, Metrics, Bug
from security import hash_password

# Create session
Session = sessionmaker(bind=engine)

def create_test_user(db):
    """Create a test user for easy login"""
    # Check if test user already exists
    existing_user = db.query(User).filter(User.email == "test@qalytics.com").first()
    if existing_user:
        print("⚠️  Test user already exists")
        return existing_user
    
    # Create test user
    test_user = User(
        email="test@qalytics.com",
        username="testuser",
        full_name="Test User",
        role="manager",
        hashed_password=hash_password("password123"),
        is_active=True
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    print("✅ Test user created:")
    print(f"   📧 Email: test@qalytics.com")
    print(f"   🔑 Password: password123")
    print(f"   👤 Role: manager")
    
    return test_user

def create_sample_pnls(db, user_id):
    """Create sample PnLs (Product Lines)"""
    pnls_data = [
        {"name": "ePharmacy", "description": "Online Pharmacy Platform"},
        {"name": "eDiagnostics", "description": "Digital Diagnostics Services"},
        {"name": "Hospital Management", "description": "Healthcare Management System"}
    ]
    
    created_pnls = []
    for pnl_data in pnls_data:
        # Check if PnL already exists
        existing_pnl = db.query(PnL).filter(PnL.name == pnl_data["name"]).first()
        if not existing_pnl:
            pnl = PnL(**pnl_data)
            db.add(pnl)
            db.commit()
            db.refresh(pnl)
            created_pnls.append(pnl)
            print(f"✅ Created PnL: {pnl.name}")
        else:
            created_pnls.append(existing_pnl)
    
    return created_pnls

def create_sample_releases(db, pnls, user_id):
    """Create sample releases for PnLs"""
    releases_data = [
        {"pnl_id": pnls[0].id, "version": "v2.1.0", "release_date": datetime.now() - timedelta(days=1), "status": "released", "description": "Major feature update with bug fixes", "created_by": user_id},
        {"pnl_id": pnls[0].id, "version": "v2.2.0", "release_date": datetime.now() + timedelta(days=15), "status": "in_progress", "description": "Performance improvements and new API endpoints", "created_by": user_id},
        {"pnl_id": pnls[1].id, "version": "v1.5.0", "release_date": datetime.now() - timedelta(days=10), "status": "released", "description": "Enhanced diagnostics reporting", "created_by": user_id},
        {"pnl_id": pnls[1].id, "version": "v1.6.0", "release_date": datetime.now() + timedelta(days=10), "status": "in_progress", "description": "Mobile app integration", "created_by": user_id},
        {"pnl_id": pnls[2].id, "version": "v3.0.0", "release_date": datetime.now() - timedelta(days=5), "status": "released", "description": "Complete system overhaul", "created_by": user_id},
    ]
    
    created_releases = []
    for release_data in releases_data:
        release = Release(**release_data)
        db.add(release)
        db.commit()
        db.refresh(release)
        created_releases.append(release)
        print(f"✅ Created Release: {release.version} for PnL ID {release.pnl_id}")
    
    return created_releases

def create_sample_metrics(db, releases, user_id):
    """Create sample metrics for releases"""
    import random
    
    for release in releases:
        # Create 2-3 metrics entries per release
        for i in range(random.randint(2, 3)):
            executed = random.randint(80, 450)
            passed = random.randint(int(executed * 0.7), int(executed * 0.95))
            failed = executed - passed
            
            metrics = Metrics(
                release_id=release.id,
                test_cases_executed=executed,
                test_cases_passed=passed,
                test_cases_failed=failed,
                test_coverage_percent=round(random.uniform(70.0, 95.0), 1),
                automation_coverage_percent=round(random.uniform(40.0, 85.0), 1),
                bugs_found=random.randint(5, 25),
                critical_bugs=random.randint(0, 3),
                major_bugs=random.randint(2, 8),
                minor_bugs=random.randint(5, 15),
                execution_time_hours=round(random.uniform(8.0, 40.0), 1),
                created_at=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            db.add(metrics)
        
        db.commit()
        print(f"✅ Created metrics for Release: {release.version}")

def create_sample_bugs(db, releases, user_id):
    """Create sample bugs for releases"""
    import random
    
    severities = ["low", "medium", "high", "critical"]
    priorities = ["low", "medium", "high", "urgent"]
    statuses = ["open", "in_progress", "fixed", "closed"]
    environments = ["dev", "staging", "prod"]
    
    for release in releases:
        # Create 5-12 bugs per release
        for i in range(random.randint(5, 12)):
            bug = Bug(
                release_id=release.id,
                title=f"Sample Bug {i+1} - {random.choice(['Login issue', 'UI alignment', 'API timeout', 'Data validation', 'Performance lag'])}",
                description=f"This is a sample bug for testing purposes in release {release.version}",
                severity=random.choice(severities),
                priority=random.choice(priorities),
                status=random.choice(statuses),
                environment=random.choice(environments),
                found_by=user_id,
                assigned_to=user_id if random.choice([True, False]) else None,
                created_at=datetime.now() - timedelta(days=random.randint(1, 25))
            )
            db.add(bug)
        
        db.commit()
        print(f"✅ Created bugs for Release: {release.version}")

def seed_database():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    db = Session()
    
    try:
        # Create test user
        user = create_test_user(db)
        
        # Create sample PnLs
        pnls = create_sample_pnls(db, user.id)
        
        # Create sample releases
        releases = create_sample_releases(db, pnls, user.id)
        
        # Create sample metrics
        create_sample_metrics(db, releases, user.id)
        
        # Create sample bugs
        create_sample_bugs(db, releases, user.id)
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n📋 Test Credentials:")
        print("   📧 Email: test@qalytics.com")
        print("   🔑 Password: password123")
        print("   👤 Role: Manager")
        print("\n🚀 You can now login and explore the QAlytics dashboard!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()