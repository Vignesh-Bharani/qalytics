"""
Add PnL Metrics table migration
"""

from sqlalchemy import text

def upgrade(engine):
    """Create PnL metrics table"""
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pnl_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pnl_id INTEGER NOT NULL,
                features_shipped INTEGER DEFAULT 0,
                total_testcases_executed INTEGER DEFAULT 0,
                total_bugs_logged INTEGER DEFAULT 0,
                testcase_peer_review INTEGER DEFAULT 0,
                regression_bugs_found INTEGER DEFAULT 0,
                sanity_time_avg_hours DECIMAL(5,2) DEFAULT 0.0,
                api_test_time_avg_hours DECIMAL(5,2) DEFAULT 0.0,
                automation_coverage_percent DECIMAL(5,2) DEFAULT 0.0,
                escaped_bugs INTEGER DEFAULT 0,
                test_coverage_percent DECIMAL(5,2) DEFAULT 0.0,
                testcases_per_bug DECIMAL(5,2) DEFAULT 0.0,
                bugs_per_100_tests DECIMAL(5,2) DEFAULT 0.0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pnl_id) REFERENCES pnls (id) ON DELETE CASCADE
            )
        """))
        conn.commit()

def downgrade(engine):
    """Drop PnL metrics table"""
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS pnl_metrics"))
        conn.commit()

if __name__ == "__main__":
    from database import engine
    upgrade(engine)
    print("PnL metrics table created successfully!")