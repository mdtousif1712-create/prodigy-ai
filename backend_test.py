#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class ProdigyAITester:
    def __init__(self, base_url="https://scholar-ai-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.teacher_token = None
        self.student_token = None
        self.teacher_user = None
        self.student_user = None
        self.test_class_id = None
        self.test_assignment_id = None
        self.test_submission_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_auth_signup_teacher(self):
        """Test teacher signup"""
        teacher_data = {
            "username": f"teacher_{uuid.uuid4().hex[:8]}",
            "email": f"teacher_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Teacher",
            "role": "teacher"
        }
        
        success, response = self.run_test(
            "Teacher Signup",
            "POST",
            "auth/signup",
            200,
            data=teacher_data
        )
        
        if success and 'token' in response:
            self.teacher_token = response['token']
            self.teacher_user = response['user']
            return True
        return False

    def test_auth_signup_student(self):
        """Test student signup"""
        student_data = {
            "username": f"student_{uuid.uuid4().hex[:8]}",
            "email": f"student_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Student",
            "role": "student"
        }
        
        success, response = self.run_test(
            "Student Signup",
            "POST",
            "auth/signup",
            200,
            data=student_data
        )
        
        if success and 'token' in response:
            self.student_token = response['token']
            self.student_user = response['user']
            return True
        return False

    def test_auth_login_teacher(self):
        """Test teacher login"""
        if not self.teacher_user:
            return False
            
        login_data = {
            "email": self.teacher_user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Teacher Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'token' in response

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            token=self.teacher_token
        )
        return success

    def test_create_class(self):
        """Test creating a class"""
        class_data = {
            "name": "Test Mathematics Class",
            "description": "A test class for mathematics",
            "subject": "Mathematics"
        }
        
        success, response = self.run_test(
            "Create Class",
            "POST",
            "classes",
            200,
            data=class_data,
            token=self.teacher_token
        )
        
        if success and 'id' in response:
            self.test_class_id = response['id']
            self.class_code = response['class_code']
            return True
        return False

    def test_get_classes(self):
        """Test getting classes"""
        success, response = self.run_test(
            "Get Classes",
            "GET",
            "classes",
            200,
            token=self.teacher_token
        )
        return success

    def test_join_class(self):
        """Test student joining class"""
        if not self.class_code:
            return False
            
        join_data = {
            "class_code": self.class_code
        }
        
        success, response = self.run_test(
            "Join Class",
            "POST",
            "classes/join",
            200,
            data=join_data,
            token=self.student_token
        )
        return success

    def test_create_assignment(self):
        """Test creating an assignment"""
        if not self.test_class_id:
            return False
            
        assignment_data = {
            "class_id": self.test_class_id,
            "title": "Test Assignment",
            "description": "This is a test assignment",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "max_points": 100
        }
        
        success, response = self.run_test(
            "Create Assignment",
            "POST",
            "assignments",
            200,
            data=assignment_data,
            token=self.teacher_token
        )
        
        if success and 'id' in response:
            self.test_assignment_id = response['id']
            return True
        return False

    def test_get_assignments(self):
        """Test getting assignments"""
        success, response = self.run_test(
            "Get Assignments",
            "GET",
            "assignments",
            200,
            token=self.student_token
        )
        return success

    def test_submit_assignment(self):
        """Test submitting an assignment"""
        if not self.test_assignment_id:
            return False
            
        submission_data = {
            "assignment_id": self.test_assignment_id,
            "content": "This is my test submission content",
            "file_ids": []
        }
        
        success, response = self.run_test(
            "Submit Assignment",
            "POST",
            "submissions",
            200,
            data=submission_data,
            token=self.student_token
        )
        
        if success and 'id' in response:
            self.test_submission_id = response['id']
            return True
        return False

    def test_grade_submission(self):
        """Test grading a submission"""
        if not self.test_submission_id:
            return False
            
        grade_data = {
            "submission_id": self.test_submission_id,
            "grade": 85,
            "remarks": "Good work!"
        }
        
        success, response = self.run_test(
            "Grade Submission",
            "PUT",
            "submissions/grade",
            200,
            data=grade_data,
            token=self.teacher_token
        )
        return success

    def test_create_announcement(self):
        """Test creating an announcement"""
        if not self.test_class_id:
            return False
            
        announcement_data = {
            "class_id": self.test_class_id,
            "title": "Test Announcement",
            "content": "This is a test announcement for the class"
        }
        
        success, response = self.run_test(
            "Create Announcement",
            "POST",
            "announcements",
            200,
            data=announcement_data,
            token=self.teacher_token
        )
        return success

    def test_get_announcements(self):
        """Test getting announcements"""
        success, response = self.run_test(
            "Get Announcements",
            "GET",
            "announcements",
            200,
            token=self.student_token
        )
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        ai_data = {
            "prompt": "Explain the concept of photosynthesis",
            "context": "Biology lesson"
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data=ai_data,
            token=self.student_token
        )
        return success

    def test_file_upload(self):
        """Test file upload functionality"""
        # Create a simple test file
        test_content = "This is a test file content for PRODIGY AI"
        
        files = {
            'file': ('test.txt', test_content, 'text/plain')
        }
        
        success, response = self.run_test(
            "File Upload",
            "POST",
            "files/upload",
            200,
            files=files,
            token=self.teacher_token
        )
        return success

    def test_get_notifications(self):
        """Test getting notifications"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200,
            token=self.student_token
        )
        return success

    def test_get_calendar(self):
        """Test calendar API"""
        success, response = self.run_test(
            "Get Calendar",
            "GET",
            "calendar",
            200,
            token=self.student_token
        )
        return success

    def test_get_leaderboard(self):
        """Test leaderboard API"""
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200,
            token=self.student_token
        )
        return success

    def test_search(self):
        """Test search functionality"""
        success, response = self.run_test(
            "Search",
            "GET",
            "search?q=test",
            200,
            token=self.teacher_token
        )
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting PRODIGY AI Backend Tests")
        self.log(f"📍 Testing against: {self.base_url}")
        
        # Authentication Tests
        self.log("\n📋 Authentication Tests")
        if not self.test_auth_signup_teacher():
            self.log("❌ Teacher signup failed - stopping tests")
            return False
            
        if not self.test_auth_signup_student():
            self.log("❌ Student signup failed - stopping tests")
            return False
            
        self.test_auth_login_teacher()
        self.test_auth_me()
        
        # Class Management Tests
        self.log("\n📋 Class Management Tests")
        if not self.test_create_class():
            self.log("❌ Class creation failed - skipping dependent tests")
        else:
            self.test_get_classes()
            self.test_join_class()
        
        # Assignment Tests
        self.log("\n📋 Assignment Tests")
        if not self.test_create_assignment():
            self.log("❌ Assignment creation failed - skipping dependent tests")
        else:
            self.test_get_assignments()
            if not self.test_submit_assignment():
                self.log("❌ Assignment submission failed")
            else:
                self.test_grade_submission()
        
        # Communication Tests
        self.log("\n📋 Communication Tests")
        self.test_create_announcement()
        self.test_get_announcements()
        
        # AI and File Tests
        self.log("\n📋 AI and File Tests")
        self.test_ai_chat()
        self.test_file_upload()
        
        # Other Features
        self.log("\n📋 Other Features")
        self.test_get_notifications()
        self.test_get_calendar()
        self.test_get_leaderboard()
        self.test_search()
        
        return True

    def print_summary(self):
        """Print test summary"""
        self.log(f"\n📊 Test Summary")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            self.log(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                self.log(f"  - {test['test']}: {error_msg}")
        
        return len(self.failed_tests) == 0

def main():
    tester = ProdigyAITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        tester.log("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        tester.log(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())