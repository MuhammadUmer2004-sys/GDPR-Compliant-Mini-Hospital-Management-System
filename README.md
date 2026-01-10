🏥 GDPR-Compliant Mini Hospital Management System
Implementing the CIA Triad (Confidentiality, Integrity, Availability)
📌 Project Overview

This project is a privacy-centric Hospital Management Dashboard developed using Python, Streamlit, and SQLite/MySQL, inspired by modern GDPR requirements and the CIA security triad.
The system demonstrates how healthcare data can be securely digitized while ensuring:
Lawful, fair, and transparent processing
Data minimization and anonymization
Role-based access control (RBAC)
Auditability and accountability
This solution is designed for academic demonstration purposes and simulates a community hospital transitioning from paper-based records to a digital system.

🎯 Objectives

Protect patient data using anonymization and encryption
Enforce role-based permissions
Maintain audit logs for accountability
Ensure system availability and reliability
Align system design with GDPR principles

🔐 CIA Triad Implementation

1️⃣ Confidentiality (Privacy & Data Protection)
Sensitive patient data is masked or anonymized
Optional Fernet encryption for reversible anonymization
Role-based data visibility:
Admin → Full access (raw + anonymized)
Doctor → Anonymized data only
Receptionist → Add/edit records, no sensitive data view

Secure login & authentication system
Examples:

Name      → ANON_1021
Contact   → XXX-XXX-4592
Diagnosis → Masked / Encrypted

2️⃣ Integrity (Accuracy & Accountability)
Activity logging for every action:
Login
View
Update
Anonymization
Logs store:
User ID
Role
Timestamp
Action details
Admin-only Integrity Audit Log
Database constraints and backend validation prevent unauthorized modifications

3️⃣ Availability (Reliability & Access)
Stable database connection with exception handling
Continuous system availability for authorized users
CSV export / backup option for recovery
Displays last synchronization time / uptime in dashboard footer

🛠️ Tech Stack
Frontend: Streamlit
Backend: Python
Database: SQLite / MySQL
Security:
hashlib
cryptography (Fernet)
Visualization (Optional): Streamlit charts

🗂️ Database Schema

Users Table
user_id	username	password	role
1	admin	admin123	admin
2	Dr_Bob	doc123	doctor
3	Alice_recep	rec123	receptionist

Patients Table

| patient_id | name | contact | diagnosis | anonymized_name | anonymized_contact | date_added |

Logs Table

| log_id | user_id | role | action | timestamp | details |

🔄 System Workflow
User logs in → Authentication verifies role
RBAC controls available actions and views
Admin anonymizes sensitive data
Doctor views anonymized records
Receptionist adds/edits patient records
All actions are logged automatically
Admin reviews logs and exports data securely

📁 Project Structure

hospital_dashboard/
│
├── app.py   # Main Streamlit app

├── database.db             # SQLite database

├── auth.py                 # Authentication & RBAC

├── anonymization.py        # Masking & encryption logic

├── logs.py                 # Logging & audit trail

├── utils.py                # Helper functions

├── requirements.txt

└── README.md

🚀 How to Run the Project

1️⃣ Create Virtual Environment (Optional)

python -m venv venv

source venv/bin/activate   # Windows: venv\Scripts\activate

2️⃣ Install Dependencies
pip install -r requirements.txt

3️⃣ Run the Application
streamlit run app.py
