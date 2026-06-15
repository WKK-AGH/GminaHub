CREATE TYPE session_status_enum AS ENUM ('SCHEDULED', 'ACTIVE', 'CONCLUDED');
CREATE TYPE voting_status_enum AS ENUM ('PENDING', 'OPEN', 'CLOSED');
CREATE TYPE vote_choice_enum AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');

CREATE TABLE roles (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE permissions (id SERIAL PRIMARY KEY, code VARCHAR(100) NOT NULL UNIQUE, description VARCHAR(255));
CREATE TABLE role_permissions (role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE, permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id));
CREATE TABLE users (id SERIAL PRIMARY KEY, role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE committees (id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE committee_members (committee_id INTEGER REFERENCES committees(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, is_chairperson BOOLEAN DEFAULT FALSE, PRIMARY KEY (committee_id, user_id));
CREATE TABLE sessions (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, committee_id INTEGER REFERENCES committees(id) ON DELETE SET NULL, scheduled_date TIMESTAMP NOT NULL, status session_status_enum DEFAULT 'SCHEDULED', quorum_required INTEGER NOT NULL);
CREATE TABLE agenda_items (id SERIAL PRIMARY KEY, session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE, position INTEGER NOT NULL, title VARCHAR(255) NOT NULL);
CREATE TABLE documents (id SERIAL PRIMARY KEY, agenda_item_id INTEGER REFERENCES agenda_items(id) ON DELETE CASCADE, file_name VARCHAR(255) NOT NULL, file_url VARCHAR(512) NOT NULL, uploaded_at TIMESTAMP DEFAULT NOW());
CREATE TABLE votings (id SERIAL PRIMARY KEY, agenda_item_id INTEGER REFERENCES agenda_items(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, status voting_status_enum DEFAULT 'PENDING', started_at TIMESTAMP, ended_at TIMESTAMP, total_eligible_voters INTEGER, total_votes_cast INTEGER, is_valid BOOLEAN DEFAULT NULL);
CREATE TABLE votes (id BIGSERIAL PRIMARY KEY, voting_id INTEGER REFERENCES votings(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, choice vote_choice_enum NOT NULL, voted_at TIMESTAMP DEFAULT NOW());
CREATE TABLE session_summaries (session_id INTEGER PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE, attendance_count INTEGER NOT NULL, notes TEXT, pdf_export_url VARCHAR(512));
CREATE TABLE system_logs (id BIGSERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, action VARCHAR(100) NOT NULL, payload JSONB, ip_address VARCHAR(45), timestamp TIMESTAMP DEFAULT NOW());
