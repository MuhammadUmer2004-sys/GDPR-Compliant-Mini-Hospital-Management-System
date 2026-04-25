# db_init.py

# Import SQLite library for database operations
import sqlite3

# Import password hashing function from Werkzeug
from werkzeug.security import generate_password_hash

# Name of the database file
DB = "hospital.db"

def init_db():
    # Connect to the SQLite database (creates file if not existing)
    conn = sqlite3.connect(DB)

    # Cursor object allows executing SQL commands
    c = conn.cursor()

    # ----------------------------------------------------------
    # Create USERS table if it does not already exist
    # Stores login username, hashed password, and role
    # ----------------------------------------------------------
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-increment unique user ID
        username TEXT UNIQUE,                        -- Username (unique)
        password TEXT,                               -- Hashed password
        role TEXT                                     -- Role: admin, doctor, receptionist
    )''')

    # ----------------------------------------------------------
    # Create PATIENTS table
    # Stores original and anonymized patient data
    # ----------------------------------------------------------
    c.execute('''CREATE TABLE IF NOT EXISTS patients (
        patient_id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique ID for each patient
        name TEXT,                                    -- Original name
        contact TEXT,                                 -- Original contact number
        diagnosis TEXT,                               -- Medical diagnosis
        anonymized_name TEXT,                         -- Anonymized name
        anonymized_contact TEXT,                      -- Masked or encrypted contact
        date_added TEXT                               -- Timestamp when record was added
    )''')

    # ----------------------------------------------------------
    # Create LOGS table
    # Stores every system activity for auditing/GDPR compliance
    # ----------------------------------------------------------
    c.execute('''CREATE TABLE IF NOT EXISTS logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Unique log entry ID
        user_id INTEGER,                              -- ID of user who performed the action
        role TEXT,                                    -- Role of the user
        action TEXT,                                  -- Type of action performed
        timestamp TEXT,                               -- When the action occurred
        details TEXT                                  -- Extra information about the action
    )''')

    # ----------------------------------------------------------
    # Default user accounts to insert into USERS table
    # Passwords are hashed using Werkzeug for security
    # ----------------------------------------------------------
    users = [
        ("admin", generate_password_hash("admin123"), "admin"),             # Admin account
        ("drbob", generate_password_hash("doc123"), "doctor"),              # Doctor account
        ("alice_recep", generate_password_hash("rec123"), "receptionist")   # Receptionist account
    ]

    # Loop through default users and insert them
    for u, p, r in users:
        try:
            # Insert user into database
            c.execute("INSERT INTO users(username,password,role) VALUES (?, ?, ?)", (u, p, r))
        except:
            # Ignore error if user already exists
            pass

    # Save all changes to the database
    conn.commit()

    # Close database connection
    conn.close()

# Run database initialization when file is executed directly
if __name__ == "__main__":
    init_db()
    print("DB initialized.")
