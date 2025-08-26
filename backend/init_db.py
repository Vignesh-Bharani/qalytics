#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
import models

def init_database():
    """Initialize the database by creating all tables"""
    print("🔧 Initializing QAlytics database...")
    
    try:
        # Create all tables
        models.Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        print("📋 Created tables:")
        print("   - users")
        print("   - main_pnls") 
        print("   - sub_pnls")
        print("   - main_pnl_metrics")
        print("   - sub_pnl_metrics")
        print("   - sub_pnl_detail_metrics")
        print("\n🎯 Database initialization complete!")
        print("💡 Next step: Run 'python create_sample_data.py' to add sample data")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

if __name__ == "__main__":
    init_database()