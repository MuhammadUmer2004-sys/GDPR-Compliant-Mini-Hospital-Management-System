import streamlit as st  # Streamlit library for building interactive web apps and dashboards
import pandas as pd  # Pandas library for handling dataframes and performing SQL queries
from datetime import datetime  # To work with timestamps, e.g., login time, system uptime

# Import utility functions from utils.py for verification, encryption, anonymization, logging, and deletion
from utils import (
    verify_user,  # Function to verify user credentials from the database
    get_conn,  # Function to get a connection to the database
    mask_contact,  # Function to irreversibly mask contact numbers
    deterministic_anonymize_name,  # Function to deterministically anonymize names
    log_action,  # Function to log user actions into logs table
    fernet_encrypt,  # Function for reversible encryption using Fernet
    fernet_decrypt,  # Function to decrypt Fernet-encrypted data
    delete_patient,  # Function to delete a patient record
    delete_old_logs,  # Function to delete old logs from the logs table
    delete_old_patients  # Function to delete old patients from the database
)

# ---------------- PAGE CONFIG ---------------- #
st.set_page_config(page_title="Hospital Privacy Dashboard", layout="wide")  # Set the page title and layout of dashboard

# ---------------- GDPR CONSENT CHECK ---------------- #
if "consent_given" not in st.session_state:  # Check if consent flag exists in session
    st.session_state.consent_given = False  # Initialize consent flag to False if not present

if not st.session_state.consent_given:  # If consent is not given yet
    consent = st.sidebar.checkbox(
        "I acknowledge and consent to the hospital's data privacy policy and GDPR compliance."  # GDPR consent checkbox
    )
    if consent:  # If user checks the box
        st.session_state.consent_given = True  # Update session state to indicate consent given
    else:
        st.warning("Please give consent to use the system.")  # Show warning message if consent not given
        st.stop()  # Stop execution until consent is given

# ---------------- SYSTEM UPTIME ---------------- #
if "start_time" not in st.session_state:  # Check if system start time exists in session
    st.session_state.start_time = datetime.utcnow()  # Save current UTC time as system start time

def uptime():  # Function to calculate system uptime
    delta = datetime.utcnow() - st.session_state.start_time  # Difference between current time and start time
    return str(delta).split(".")[0]  # Remove milliseconds and return as clean string

# ---------------- LOGIN SYSTEM ---------------- #
if "user" not in st.session_state:  # Check if user session exists
    st.session_state.user = None  # Initialize user session as None
if "login_successful" not in st.session_state:  # Check if login flag exists
    st.session_state.login_successful = False  # Initialize login success flag as False

def login():  # Function to render login form and process credentials
    """Render login form and process login"""
    st.title("Hospital Management Dashboard — Login")  # Display dashboard login page title
    with st.form("login_form"):  # Create login form context
        username = st.text_input("Username")  # Input field for username
        password = st.text_input("Password", type="password")  # Input field for password (hidden characters)
        submitted = st.form_submit_button("Login")  # Submit button for login form

        if submitted:  # When the login form is submitted
            try:
                user = verify_user(username.strip(), password.strip())  # Call utility function to verify credentials
            except Exception:  # If verification fails
                st.error("Login system error.")  # Display login system error
                return  # Exit function

            if user:  # If credentials are valid
                st.session_state.user = user  # Save user info in session state
                st.session_state.login_successful = True  # Set login flag to True
                log_action(user["user_id"], user["role"], "login", f"{user['username']} logged in")  # Log login action
                st.success("Login successful! Loading dashboard...")  # Display success message
            else:  # If credentials are invalid
                st.error("Invalid credentials")  # Show invalid credentials error
                conn = get_conn()  # Open DB connection to log failed attempt
                conn.execute(
                    "INSERT INTO logs(user_id, role, action, timestamp, details) VALUES (?, ?, ?, ?, ?)",  # Insert failed login into logs
                    (None, "unknown", "failed_login", datetime.utcnow().isoformat(), f"username={username}")
                )
                conn.commit()  # Commit DB insert
                conn.close()  # Close DB connection

# Show login form if login not yet successful
if not st.session_state.login_successful:
    login()  # Call login function
    st.stop()  # Stop execution until login is successful

# ---------------- DASHBOARD ---------------- #
user = st.session_state.user  # Get logged-in user info from session
role = user["role"]  # Get user role (admin, doctor, receptionist)

# ---------------- SIDEBAR ---------------- #
st.sidebar.write(f"Signed in: **{user['username']}** ({role})")  # Display signed-in user info in sidebar
st.sidebar.button("Logout", on_click=lambda: st.session_state.clear())  # Logout button clears session state

# ---------------- DASHBOARD TABS ---------------- #
tabs = st.tabs([  # Create tabs for different sections of dashboard
    "Patients", "Add/Edit", "Anonymize",
    "Audit Logs" if role=="admin" else "Audit",  # Full Audit Logs tab only for admin
    "Export/Backup", "Activity Graphs", "About & GDPR Notes"
])

# Connect to the database
conn = get_conn()  # Open connection to hospital database

# ---------------- PATIENTS TAB ---------------- #
with tabs[0]:
    st.header("Patients")  # Display Patients tab header
    try:
        df = pd.read_sql_query("SELECT * FROM patients", conn)  # Load all patients from DB
    except Exception as e:
        st.error("DB read error")  # Show error if fetching fails
        log_action(user["user_id"], role, "db_error", str(e))  # Log DB error
        st.stop()  # Stop further execution

    # Display data according to user role
    if role == "admin":
        st.dataframe(df)  # Admin sees full patient data
    elif role == "doctor":
        if "anonymized_name" in df.columns:  # Check if anonymization done
            st.dataframe(df[["patient_id","anonymized_name","anonymized_contact","diagnosis","date_added"]])
        else:
            st.warning("Data not yet anonymized.")  # Show warning if not anonymized
    elif role == "receptionist":
        st.dataframe(df[["patient_id","date_added","diagnosis"]])  # Limited view for receptionist

    # Show system uptime and last activity
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()  # Get last log timestamp
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")  # Display last activity
    except:
        pass

    log_action(user["user_id"], role, "view_patients", f"rows={len(df)}")  # Log viewing of patient data

# ---------------- ADD / EDIT PATIENT TAB ---------------- #
with tabs[1]:
    st.header("Add / Edit Patient (Receptionist & Admin)")  # Tab header

    if role not in ["receptionist", "admin"]:  # Check if user has permission
        st.warning("You do not have permission to add/edit records.")  # Show warning if no permission
    else:
        # ---------------- ADD NEW PATIENT ---------------- #
        st.subheader("Add New Patient")
        with st.form("add_form"):  # Form to add patient
            name = st.text_input("Full name")  # Input for name
            contact = st.text_input("Contact (e.g. 03001234567)")  # Input for contact
            diagnosis = st.text_area("Diagnosis")  # Input for diagnosis
            submit = st.form_submit_button("Add Patient")  # Submit button

            if submit:  # On form submission
                try:
                    ts = datetime.utcnow().isoformat()  # Current UTC timestamp
                    cur = conn.cursor()  # Create cursor object
                    cur.execute(
                        "INSERT INTO patients(name, contact, diagnosis, anonymized_name, anonymized_contact, date_added) VALUES (?, ?, ?, ?, ?, ?)",
                        (name, contact, diagnosis, None, None, ts)  # Insert patient record with null anonymized fields
                    )
                    conn.commit()  # Commit DB changes
                    st.success("Patient added.")  # Show success message
                    log_action(user["user_id"], role, "add_patient", f"name={name}")  # Log action
                except Exception as e:
                    st.error("Failed to add patient.")  # Show error
                    log_action(user["user_id"], role, "error_add_patient", str(e))  # Log error

        # ---------------- EDIT EXISTING PATIENT ---------------- #
        st.subheader("Edit Existing Patient")
        try:
            cur = conn.cursor()  # Create cursor
            cur.execute("SELECT patient_id, name, contact, diagnosis FROM patients")  # Fetch patient records
            patients = cur.fetchall()  # Fetch all rows
        except Exception as e:
            st.error("Failed to fetch patients.")  # Show error if fetching fails
            patients = []  # Empty list if failed

        if patients:  # If patients exist
            patient_names = [f"{p['patient_id']} - {p['name']}" for p in patients]  # Create display names
            selected_patient = st.selectbox("Select Patient to Edit", patient_names)  # Dropdown to select patient
            selected_id = int(selected_patient.split(" - ")[0])  # Extract patient ID
            cur.execute("SELECT name, contact, diagnosis FROM patients WHERE patient_id=?", (selected_id,))  # Fetch selected patient
            record = cur.fetchone()  # Store record

            edit_name = st.text_input("Name", record["name"])  # Editable name field
            edit_contact = st.text_input("Contact", record["contact"])  # Editable contact field
            edit_diagnosis = st.text_area("Diagnosis", record["diagnosis"])  # Editable diagnosis field

            if st.button("Update Record"):  # Update button
                try:
                    cur.execute(
                        "UPDATE patients SET name=?, contact=?, diagnosis=? WHERE patient_id=?",
                        (edit_name, edit_contact, edit_diagnosis, selected_id)  # Update DB
                    )
                    conn.commit()  # Commit changes
                    st.success("Patient record updated successfully.")  # Show success
                    log_action(user["user_id"], role, "update_patient", f"Updated patient ID {selected_id}")  # Log action
                except Exception as e:
                    st.error("Failed to update patient.")  # Show error
                    log_action(user["user_id"], role, "error_update_patient", str(e))  # Log error

            # ---------------- DELETE PATIENT (Admin Only) ---------------- #
            if role == "admin":
                st.subheader("Delete Patient Record")  # Header
                if st.button(f"🗑️ Delete Patient ID {selected_id}"):  # Delete button
                    try:
                        delete_patient(selected_id)  # Call delete function
                        st.success(f"Patient ID {selected_id} deleted successfully.")  # Success message
                        log_action(user["user_id"], role, "delete_patient", f"Deleted patient ID {selected_id}")  # Log action
                    except Exception as e:
                        st.error("Failed to delete patient.")  # Show error
                        log_action(user["user_id"], role, "error_delete_patient", str(e))  # Log error
        else:
            st.info("No patients found. Please add a new record first.")  # Show info if no patients

    # Show uptime & last activity
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()  # Last log
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")  # Display timestamp
    except:
        pass

# ---------------- ANONYMIZATION TAB ---------------- #
with tabs[2]:
    st.header("Anonymize / Encrypt Data")  # Tab header
    if role != "admin":  # Only admin can anonymize
        st.warning("Only Admin can run anonymization.")  # Warning if not admin
    else:
        st.write("Options: mask (irreversible) or Fernet encrypt (reversible).")  # Show method options
        choice = st.radio("Method", ["mask", "fernet_encrypt"])  # Radio buttons to select method
        if st.button("Run Anonymization"):  # Run anonymization button
            try:
                cur = conn.cursor()  # DB cursor
                patients = cur.execute("SELECT patient_id, name, contact FROM patients").fetchall()  # Fetch all patients
                for p in patients:  # Loop through patients
                    pid = p["patient_id"]  # Patient ID
                    name = p["name"]  # Patient name
                    contact = p["contact"]  # Patient contact
                    anon_name = deterministic_anonymize_name(name)  # Anonymize name deterministically
                    if choice == "mask":  # Mask method
                        anon_contact = mask_contact(contact)  # Mask contact
                        cur.execute(
                            "UPDATE patients SET anonymized_name=?, anonymized_contact=? WHERE patient_id=?",
                            (anon_name, anon_contact, pid)  # Update DB
                        )
                    else:  # Fernet encryption method
                        enc_contact = fernet_encrypt(contact) if contact else None  # Encrypt contact
                        cur.execute(
                            "UPDATE patients SET anonymized_name=?, anonymized_contact=? WHERE patient_id=?",
                            (anon_name, enc_contact, pid)  # Update DB
                        )
                conn.commit()  # Commit changes
                st.success("Anonymization applied.")  # Success message
                log_action(user["user_id"], role, "anonymize", f"method={choice}, rows={len(patients)}")  # Log action
            except Exception as e:
                st.error("Anonymization failed.")  # Error message
                log_action(user["user_id"], role, "error_anonymize", str(e))  # Log error

    # Show uptime & last activity
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")
    except:
        pass

# ---------------- AUDIT LOGS TAB ---------------- #
with tabs[3]:
    st.header("Audit / Integrity Logs")  # Tab header
    if role != "admin":  # Restrict logs to admin
        st.warning("Audit logs view restricted to Admin.")  # Warning for non-admin
    else:
        logs_df = pd.read_sql_query("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500", conn)  # Fetch latest 500 logs
        st.dataframe(logs_df)  # Display logs
        if st.button("Export logs CSV"):  # Export button
            csv = logs_df.to_csv(index=False).encode('utf-8')  # Convert dataframe to CSV bytes
            st.download_button("Download logs CSV", csv, file_name="audit_logs.csv")  # Download button
        log_action(user["user_id"], role, "view_logs", f"count={len(logs_df)}")  # Log viewing action

    # Show uptime & last activity
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")
    except:
        pass

# ---------------- EXPORT / BACKUP TAB ---------------- #
with tabs[4]:
    st.header("Export / Backup")  # Tab header
    try:
        patients_df = pd.read_sql_query("SELECT * FROM patients", conn)  # Fetch patient data
        if role == "admin":  # Admin can export full data
            export_df = patients_df
        elif role == "doctor":  # Doctor gets anonymized view
            export_df = patients_df[["patient_id","anonymized_name","anonymized_contact","diagnosis","date_added"]]
        else:  # Receptionist limited view
            export_df = patients_df[["patient_id","date_added","diagnosis"]]
        st.download_button("Download Patients CSV", export_df.to_csv(index=False).encode(), "patients_export.csv")  # Download button

        if role == "admin":  # Admin can backup DB
            import shutil  # Import shutil for file copy
            if st.button("Backup DB (create copy)"):  # Backup button
                backup_name = f"hospital_backup_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.db"  # Generate backup name
                shutil.copy("hospital.db", backup_name)  # Copy DB file
                st.success(f"Backup created: {backup_name}")  # Show success
                log_action(user["user_id"], role, "backup_db", backup_name)  # Log backup action
    except Exception as e:
        st.error("Export error.")  # Show export error
        log_action(user["user_id"], role, "error_export", str(e))  # Log error

    # Show uptime & last activity
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")
    except:
        pass

# ---------------- ACTIVITY GRAPHS TAB ---------------- #
with tabs[5]:
    st.header("Real-time Activity Graphs")  # Tab header
    try:
        df_logs = pd.read_sql_query("SELECT timestamp, action FROM logs", conn)  # Fetch logs for graphs
        if not df_logs.empty:  # If logs exist
            df_logs["date"] = pd.to_datetime(df_logs["timestamp"]).dt.date  # Extract date
            activity_counts = df_logs.groupby(["date", "action"]).size().unstack(fill_value=0)  # Count actions per day
            st.line_chart(activity_counts)  # Show line chart
        else:
            st.info("No activity logs to display.")  # Info if no logs
    except Exception as e:
        st.error("Failed to generate activity graph.")  # Error
        log_action(user["user_id"], role, "error_activity_graph", str(e))  # Log error

    # Show uptime & last activity
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")
    except:
        pass

# ---------------- ABOUT / GDPR NOTES TAB ---------------- #
with tabs[6]:
    st.header("🧭 About & GDPR Notes")  # Tab header
    st.markdown("""
    **Purpose:** Show privacy policy & system compliance message.
    **Description / What to do:** Just view this section — it usually describes:
    - **Confidentiality:** Sensitive fields (name, contact) are masked or encrypted to prevent unauthorized disclosure.
    - **Integrity:** All actions (add, edit, delete, anonymize, login, export) are logged with timestamp, user, and role.
    - **Availability:** Database backups are available, exception handling ensures system uptime.
    - **Data anonymization approach:** Patient names and contacts are anonymized deterministically or encrypted (reversible) for privacy.
    - **Role-based access:** Admin, Doctor, Receptionist have different viewing/editing privileges; sensitive data is hidden from unauthorized roles.
    - **Log maintenance:** Logs keep a full audit trail for accountability and compliance.
    - **GDPR alignment:**
        - Lawful processing: Role-based access controls restrict data access.
        - Data minimization: Only necessary info is shown per role.
        - Accountability: Actions recorded for auditing and compliance.
    """)
    st.write("---")  # Separator
    st.markdown(f"**System uptime:** {uptime()} (since {st.session_state.start_time.isoformat()} UTC)")
    try:
        last_log = conn.execute("SELECT timestamp FROM logs ORDER BY timestamp DESC LIMIT 1").fetchone()
        if last_log:
            st.markdown(f"**Last activity:** {last_log['timestamp']} UTC")
    except:
        pass

# ---------------- AUTOMATIC GDPR CLEANUP ---------------- #
delete_old_logs(days=365)  # Delete logs older than 1 year
delete_old_patients(days=1095)  # Delete patients older than 3 years

# ---------------- FOOTER ---------------- #
st.sidebar.markdown(f"Footer: Uptime: {uptime()}")  # Show system uptime in sidebar footer

# Close DB connection
conn.close()  # Close the database connection at the end
