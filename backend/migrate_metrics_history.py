"""
Database migration script to add metrics_history table
Run this script to update your database schema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from database import DATABASE_URL
import models

def create_metrics_history_table():
    """Create the metrics_history table"""
    engine = create_engine(DATABASE_URL)
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS metrics_history (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        metrics_data TEXT NOT NULL,
        change_type VARCHAR(20) NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        change_description VARCHAR(500),
        previous_values TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Add indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_metrics_history_entity ON metrics_history(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_history_created_at ON metrics_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_metrics_history_changed_by ON metrics_history(changed_by);
    """
    
    try:
        with engine.connect() as connection:
            connection.execute(text(create_table_sql))
            connection.commit()
            print("✅ Successfully created metrics_history table and indexes")
    except Exception as e:
        print(f"❌ Error creating metrics_history table: {e}")
        raise

def main():
    """Run the migration"""
    print("🔄 Starting database migration...")
    print("📊 Adding metrics_history table...")
    
    create_metrics_history_table()
    
    print("✅ Migration completed successfully!")
    print("\nThe following changes were made:")
    print("1. Added metrics_history table")
    print("2. Added indexes for performance optimization")
    print("\nYou can now:")
    print("- Track all metrics changes")
    print("- View history through the API endpoints")
    print("- Access history via the frontend interface")

if __name__ == "__main__":
    main()