-- 1. ROLE (Wymuszamy ID, żeby łatwo było je przypisać)
INSERT INTO roles (id, name) VALUES
(1, 'ADMIN'),
(2, 'CHAIRPERSON'),
(3, 'MEMBER'),
(4, 'GUEST');

-- 2. UPRAWNIENIA
INSERT INTO permissions (id, code, description) VALUES
(1, 'MANAGE_USERS', 'Pełne zarządzanie użytkownikami'),
(2, 'MANAGE_SESSIONS', 'Zarządzanie sesjami i agendą'),
(3, 'VOTE', 'Prawo do oddawania głosów'),
(4, 'VIEW_DOCUMENTS', 'Podgląd załączników i dokumentów');

-- 3. PRZYPISANIE UPRAWNIEŃ DO RÓL
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- Admin ma wszystko
(2, 2), (2, 3), (2, 4),         -- Przewodniczący
(3, 3), (3, 4);                 -- Zwykły Radny

-- 4. UŻYTKOWNICY
-- UWAGA: Hasło dla wszystkich to: password123 (zahashowane w standardzie bcrypt)
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash) VALUES
(1, 1, 'Jan', 'Kowalski', 'admin@esesja.pl', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'),
(2, 2, 'Anna', 'Nowak', 'przewodniczaca@esesja.pl', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'),
(3, 3, 'Piotr', 'Wiśniewski', 'radny1@esesja.pl', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'),
(4, 3, 'Maria', 'Wójcik', 'radna2@esesja.pl', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');

-- 5. KOMISJE
INSERT INTO committees (id, name) VALUES
(1, 'Komisja Budżetu i Finansów'),
(2, 'Komisja Edukacji i Sportu');

-- 6. CZŁONKOWIE KOMISJI
INSERT INTO committee_members (committee_id, user_id, is_chairperson) VALUES
(1, 2, TRUE),  -- Anna Nowak (Przewodnicząca w komisji 1)
(1, 3, FALSE), -- Piotr Wiśniewski (Członek)
(2, 4, TRUE);  -- Maria Wójcik (Przewodnicząca w komisji 2)

-- 7. SESJE (current_agenda_item_id na razie puste, bo punkty agendy jeszcze nie istnieją)
INSERT INTO sessions (id, title, committee_id, chair_user_id, scheduled_date, status, quorum_required) VALUES
(1, 'VIII Sesja Rady Miejskiej', NULL, 2, '2026-06-30 10:00:00', 'SCHEDULED', 2),
(2, 'Posiedzenie Komisji Budżetowej', 1, 2, '2026-06-20 14:00:00', 'CONCLUDED', 2);

-- 8. PUNKTY AGENDY
INSERT INTO agenda_items (id, session_id, position, title, status) VALUES
(1, 1, 1, 'Otwarcie sesji i stwierdzenie kworum', 'PENDING'),
(2, 1, 2, 'Głosowanie nad uchwałą budżetową', 'PENDING'),
(3, 2, 1, 'Podsumowanie wydatków za Q2', 'COMPLETED');

-- AKTUALIZACJA SESJI (Ustawienie aktywnego punktu agendy, teraz gdy już istnieją)
UPDATE sessions SET current_agenda_item_id = 1 WHERE id = 1;

-- 9. DOKUMENTY
INSERT INTO documents (id, agenda_item_id, file_name, file_url, uploaded_by, file_size, mime_type) VALUES
(1, 2, 'projekt_uchwaly_budzetowej_2026.pdf', 'https://s3.amazonaws.com/esesja/docs/budzet_2026.pdf', 1, 1024500, 'application/pdf');

-- 10. GŁOSOWANIA (Dla zakończonej komisji budżetowej)
INSERT INTO votings (id, agenda_item_id, title, status, started_at, ended_at, total_eligible_voters, total_votes_cast, is_valid) VALUES
(1, 3, 'Przyjęcie sprawozdania finansowego', 'CLOSED', '2026-06-20 14:15:00', '2026-06-20 14:20:00', 3, 3, TRUE);

-- 11. GŁOSY Z OSTATNIEGO GŁOSOWANIA
INSERT INTO votes (voting_id, user_id, choice) VALUES
(1, 2, 'FOR'),
(1, 3, 'FOR'),
(1, 4, 'ABSTAIN');

-- 12. PODSUMOWANIE ZAKOŃCZONEJ SESJI
INSERT INTO session_summaries (session_id, attendance_count, notes) VALUES
(2, 3, 'Sprawozdanie finansowe zostało przyjęte większością głosów.');

-- 13. LOGI SYSTEMOWE
INSERT INTO system_logs (user_id, action, ip_address) VALUES
(1, 'USER_CREATED', '192.168.1.10'),
(2, 'SESSION_CONCLUDED', '10.0.0.5');

-- 14. NAPRAWA SEKWENCJI ID (Bardzo ważne po ręcznym wymuszaniu ID!)
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('committees_id_seq', (SELECT MAX(id) FROM committees));
SELECT setval('sessions_id_seq', (SELECT MAX(id) FROM sessions));
SELECT setval('agenda_items_id_seq', (SELECT MAX(id) FROM agenda_items));
SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));
SELECT setval('votings_id_seq', (SELECT MAX(id) FROM votings));
