import sqlite3  # SQLite database library for DB operations
from datetime import datetime, timedelta  # Used for timestamps and retention calculations
from werkzeug.security import check_password_hash, generate_password_hash  # Secure password hashing utilities
import hashlib  # For SHA-256 hashing (deterministic anonymization)
from cryptography.fernet import Fernet  # For reversible encryption/decryption
import os  # Used for checking/creating key files

DB = "hospital.db"  # Name of the SQLite database file
FERNET_KEY_PATH = "fernet.key"  # Path to store/load encryption key

# Initialize Fernet key
if not os.path.exists(FERNET_KEY_PATH):  # Check if encryption key file does NOT exist
    key = Fernet.generate_key()  # Generate a new encryption key
    with open(FERNET_KEY_PATH, "wb") as f:  # Open key file for writing in binary mode
        f.write(key)  # Save the generated key
else:
    key = open(FERNET_KEY_PATH, "rb").read()  # Load existing key if file already exists

fernet = Fernet(key)  # Create Fernet encryption object using loaded key

# --- Database connection ---
def get_conn():
    conn = sqlite3.connect(DB, check_same_thread=False)  # Create DB connection; allow multi-thread use
    conn.row_factory = sqlite3.Row  # Return rows as dictionary-like objects
    return conn  # Return active DB connection

# --- Auth helpers ---
def verify_user(username, password):
    conn = get_conn()  # Open database connection
    c = conn.cursor()  # Create cursor to run SQL queries
    c.execute("SELECT user_id, username, password, role FROM users WHERE username = ?", (username,))  # Fetch user
    row = c.fetchone()  # Read a single row
    conn.close()  # Close DB connection
    if row and check_password_hash(row["password"], password):  # Verify hashed password
        return {"user_id": row["user_id"], "username": row["username"], "role": row["role"]}  # Return user info
    return None  # If user not found or password mismatch

def add_user(username, password, role):
    conn = get_conn()  # Open DB connection
    c = conn.cursor()  # Create cursor for SQL
    try:
        c.execute(
            "INSERT INTO users(username,password,role) VALUES (?, ?, ?)",  # SQL insert
            (username, generate_password_hash(password), role)  # Hash password before saving
        )
        conn.commit()  # Save changes
    except Exception as e:  # Catch any insert error
        conn.close()  # Close connection
        raise e  # Re-throw error
    conn.close()  # Close DB connection after work

# --- Anonymization / masking ---
def mask_contact(contact):
    if not contact:  # If empty/null, return None
        return None
    last4 = contact[-4:]  # Extract last 4 digits
    return "XXX-XXX-" + last4  # Return masked format

def deterministic_anonymize_name(name):
    if not name:  # If name is empty/null
        return None
    h = hashlib.sha256(name.encode()).hexdigest()  # Create SHA-256 hash of name
    return "ANON_" + h[:6]  # Return deterministic anonymized prefix + first 6 hash chars

def fernet_encrypt(plaintext):
    if plaintext is None:  # If nothing to encrypt
        return None
    return fernet.encrypt(plaintext.encode()).decode()  # Encrypt text → bytes → decode to string

def fernet_decrypt(token):
    if token is None:  # If encrypted token missing
        return None
    return fernet.decrypt(token.encode()).decode()  # Convert encrypted string → bytes → decrypt to original text

# --- Logging ---
def log_action(user_id, role, action, details=""):
    ts = datetime.utcnow().isoformat()  # Current timestamp in ISO format
    conn = get_conn()  # Open DB connection
    c = conn.cursor()  # Create cursor
    c.execute(
        "INSERT INTO logs(user_id, role, action, timestamp, details) VALUES (?, ?, ?, ?, ?)",  # Insert log row
        (user_id, role, action, ts, details)  # Insert provided values
    )
    conn.commit()  # Save log entry
    conn.close()  # Close DB

# --- Delete Patient ---
def delete_patient(patient_id):
    conn = get_conn()  # Open DB
    c = conn.cursor()  # Create cursor
    try:
        c.execute("DELETE FROM patients WHERE patient_id=?", (patient_id,))  # Delete patient record
        conn.commit()  # Save DB change
    finally:
        conn.close()  # Always close connection

# --- GDPR / Data retention ---
def delete_old_logs(days=365):
    """Delete logs older than 'days' for GDPR compliance."""
    cutoff = datetime.utcnow() - timedelta(days=days)  # Calculate cutoff date
    conn = get_conn()  # Open DB
    c = conn.cursor()  # Cursor
    c.execute("DELETE FROM logs WHERE timestamp < ?", (cutoff.isoformat(),))  # Delete old logs
    conn.commit()  # Save changes
    conn.close()  # Close DB

def delete_old_patients(days=1095):
    """Delete patients added more than 'days' ago (default 3 years)."""
    cutoff = datetime.utcnow() - timedelta(days=days)  # Calculate cutoff date
    conn = get_conn()  # Open DB
    c = conn.cursor()  # Cursor
    c.execute("DELETE FROM patients WHERE date_added < ?", (cutoff.isoformat(),))  # Delete old patient records
    conn.commit()  # Save changes
    conn.close()  # Close DB
