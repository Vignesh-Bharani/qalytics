#!/usr/bin/env python3

import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth():
    """Test authentication endpoints"""
    print("🔐 Testing Authentication...")
    
    # Test login
    login_data = {
        "email": "test@qalytics.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        user = data["user"]
        print(f"✅ Login successful - User: {user['email']}, Role: {user['role']}")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def test_dashboard(token):
    """Test dashboard endpoint"""
    print("\n📊 Testing Dashboard...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/dashboard", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Dashboard loaded - Found {len(data)} Main PnLs")
        for pnl in data:
            metrics = pnl.get('metrics', {})
            print(f"   📁 {pnl['name']}: {metrics.get('total_testcases', 0)} tests, {metrics.get('test_coverage_percent', 0)}% coverage")
    else:
        print(f"❌ Dashboard failed: {response.status_code}")
        print(response.text)

def test_sub_pnls(token, main_pnl_id=1):
    """Test sub PnL endpoints"""
    print(f"\n📁 Testing Sub-PnLs for Main PnL {main_pnl_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/main-pnls/{main_pnl_id}/sub-pnls", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Sub-PnLs loaded - Found {len(data)} Sub-PnLs")
        
        if data:
            sub_pnl = data[0]
            print(f"   📦 {sub_pnl['name']}: {sub_pnl['metrics']['features_shipped']} features shipped")
            
            # Test detail metrics
            print(f"\n📈 Testing Detail Metrics for Sub-PnL {sub_pnl['id']}...")
            response = requests.get(f"{BASE_URL}/sub-pnls/{sub_pnl['id']}", headers=headers)
            
            if response.status_code == 200:
                detail_data = response.json()
                detail_metrics = detail_data.get('detail_metrics', {})
                print(f"✅ Detail metrics loaded")
                print(f"   📊 Features: {detail_metrics.get('features_shipped', 0)}")
                print(f"   🧪 Test cases: {detail_metrics.get('total_testcases_executed', 0)}")
                print(f"   🐛 Bugs: {detail_metrics.get('total_bugs_logged', 0)}")
                print(f"   ✅ Peer reviews: {detail_metrics.get('testcase_peer_review', 0)}")
            else:
                print(f"❌ Detail metrics failed: {response.status_code}")
    else:
        print(f"❌ Sub-PnLs failed: {response.status_code}")
        print(response.text)

def test_api():
    """Main test function"""
    print("🚀 Starting QAlytics API Tests...\n")
    
    # Test authentication
    token = test_auth()
    if not token:
        print("❌ Cannot proceed without valid token")
        return
    
    # Test dashboard
    test_dashboard(token)
    
    # Test sub PnLs
    test_sub_pnls(token)
    
    print("\n🎉 API tests completed!")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API server.")
        print("💡 Make sure the backend server is running: 'cd backend && python app.py'")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")