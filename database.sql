-- Schema pour la base de données du projet d'événements avec authentification distincte
-- Utilisée par le backend pour les utilisateurs publics et les administrateurs

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
-- Utilisée par l'authentification publique et l'authentification admin
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'organizer'))
);

-- Table des sessions
-- Pour gérer les sessions côté serveur si nécessaire
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des événements
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    image_alt VARCHAR(255),
    organizer_id INTEGER REFERENCES users(id),
    max_attendees INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_quantity INTEGER NOT NULL,
    purchase_limit INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Table des réservations
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    quantity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'canceled'
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'canceled'))
);

--table recus
-- Table des reçus
CREATE TABLE receipts (
                          id SERIAL PRIMARY KEY,
                          reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
                          user_id INTEGER NOT NULL REFERENCES users(id),
                          ticket_id INTEGER NOT NULL REFERENCES tickets(id),
                          qr_code TEXT NOT NULL, -- Stockage du QR code en base64 ou URL
                          pdf_url VARCHAR(255), -- Chemin vers le PDF stocké
                          amount DECIMAL(10, 2) NOT NULL,
                          payment_method VARCHAR(50),
                          payment_status VARCHAR(20) NOT NULL DEFAULT 'completed',
                          issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          CONSTRAINT fk_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
                          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
                          CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                          CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed'))
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_receipts_reservation_id ON receipts(reservation_id);
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_ticket_id ON receipts(ticket_id);

-- Données initiales pour les reçus (exemple)
INSERT INTO receipts (reservation_id, user_id, ticket_id, qr_code, pdf_url, amount, payment_method, payment_status)
VALUES
    (1, 3, 1, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', '/receipts/receipt_1.pdf', 200.00, 'credit_card', 'completed'),
    (2, 3, 3, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', '/receipts/receipt_2.pdf', 120.00, 'paypal', 'completed');

-- Table pour l'historique des opérations admin
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Supprimer la contrainte existante
ALTER TABLE reservations
DROP CONSTRAINT fk_user;

-- Ajouter la contrainte avec ON DELETE CASCADE
ALTER TABLE reservations
ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reservations
DROP CONSTRAINT reservations_user_id_fkey;

ALTER TABLE reservations
DROP CONSTRAINT fk_user,
ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;




-- Données initiales pour les utilisateurs
INSERT INTO users (username, email, password, role)
VALUES
    ('admin', 'admin@example.com', '$2b$10$TeZjXWkKh2uYLgGa7nFNJekmERgTwrXF8YPHe0NTR4hEUc/E.wmRS', 'admin'),
    ('organizer', 'organizer@example.com', '$2a$10$lPGAeg2c2FRBqT5K.5Byn.31qgJQV0LKxKDwZK.Rt40m77zIE1sTG', 'organizer'), -- 'organisateur'
    ('user', 'user@example.com', '$2a$10$f6Q18iVJbPj/WZJnJvKmH.qc76qY/nux9HylIsPhWiLVIVH1ZuySa', 'user'); -- 'user'

-- Données initiales pour les événements
INSERT INTO events (title, description, date, location, category, image_url, organizer_id, is_published)
VALUES
    ('Concert de Jazz', 'UnPOST /api/auth/admin/login
 concert de jazz avec les meilleurs musiciens locaux', '2024-06-15 19:00:00', 'Salle Apollo, Paris', 'Musique', '/images/jazz.jpg', 2, TRUE),
    ('Exposition d''Art Moderne', 'Découvrez les œuvres d''artistes contemporains', '2024-07-10 10:00:00', 'Galerie Moderna, Lyon', 'Art', '/images/art.jpg', 2, TRUE);

-- Données initiales pour les tickets
    INSERT INTO tickets (event_id, type, price, available_quantity, purchase_limit)
    VALUES
        (1, 'Early Bird', 30.00, 200, 10),
        (1, 'VIP', 100.00, 50, 2),
        (1, 'Standard', 50.00, 100, 5),
        (2, 'Early Bird', 30.00, 200, 10);

-- Données initiales pour les réservations
INSERT INTO reservations (user_id, ticket_id, quantity, status)
VALUES
    (3, 1, 2, 'confirmed'),
    (3, 3, 4, 'confirmed');

-- Indexes pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_ticket_id ON reservations(ticket_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);


-- Insertion de réservations pour différents utilisateurs et tickets
INSERT INTO reservations (user_id, ticket_id, quantity, status)
VALUES
    (1, 1, 1, 'confirmed'),  -- L'utilisateur avec id 1 réserve 1 ticket VIP pour l'événement 1
    (1, 2, 2, 'pending'),    -- L'utilisateur avec id 1 réserve 2 tickets Standard pour l'événement 1 (en attente)
    (2, 3, 1, 'confirmed'),  -- L'utilisateur avec id 2 réserve 1 ticket Early Bird pour l'événement 2
    (2, 2, 5, 'pending'),    -- L'utilisateur avec id 2 réserve 5 tickets Standard pour l'événement 1 (en attente)
    (1, 3, 2, 'confirmed');  -- L'utilisateur avec id 1 réserve 2 tickets Early Bird pour l'événement 2

INSERT INTO reservations (user_id, ticket_id, quantity, status)
VALUES
    (8, 1, 1, 'confirmed');



    -- New insert

INSERT INTO users (username, email, password, role)
VALUES
    ('AliceMartin', 'martin@example.com', '$2a$12$hjTctolv.A6yoqCUHaRUEOKKw9cWppKFTsQk9fxgi4eky4vQUBT1G', 'admin'),  -- Mot de passe: Admin123!
    ('ThomasDurand', 'thomas.durand@example.com', '$2a$12$g.3L2bWCBQCr28/y4TBtu.w2RG8O06i2kuY7zoxcq1u2TB.L2LBWe', 'organizer'),  -- Mot de passe: Durand2024!
    ('CamilleLemoine', 'camille.lemoine@example.com', '$2a$12$zbnvYZEDkS4SpGCTZ.AileAvaZ4lnxFObqnFljgvZHAW.K5tPn696', 'organizer'),  -- Mot de passe: CamilleLemoine007*
    ('LucasBernard', 'lucas.bernard@example.com', '$2a$12$SR6btWXHMnElYxkhbQ7ppeZwsJw/U8BSHf7U9eXxeIaYGiGuHSRYS', 'user'),  -- Mot de passe: Bernard123!
    ('EmmaRousseau', 'emma.rousseau@example.com', '$2a$12$il5vdXDizn415grHBA5kqO5dvAJuYmi5WAuJZBwfaJAX69LJVJlLy', 'user'),  -- Mot de passe: roussO007*
    ('HugoMorel', 'hugo.morel@example.com', '$2a$12$Ru3DIbwzEAoB.HUZfqAGuuX42CabwO6lfgd3ppDq4Yy6Gt/T6mCFS', 'user'),  -- Mot de passe: HugoMorel1234
    ('SophieLefevre', 'sophie.lefevre@example.com', '$2a$12$TqyEY4MfuhNw74XFd8d6LuKG9laGLhhWqvCxxHXZHuIqrdsJ2PhbW', 'user'),  -- Mot de passe: PapillonLefevre*
    ('MathieuPerrin', 'mathieu.perrin@example.com', '$2a$12$g2OY/xF4MEHB5C0jAKNh2OUzH6KDMc7sFRDt4hM/bep5d0HfanPQC', 'user'),  -- Mot de passe: PerrinM1414
    ('JulietteSimon', 'juliette.simon@example.com', '$2a$12$4uI5mlL1/pO8cN5xNx661OJKt5N9.oKCpOW3XTnmsWBMLwya1YKSy', 'user'),  -- Mot de passe: BelleJulieta0*
    ('NathanDubois', 'nathan.dubois@example.com', '$2a$12$uVciKQmK6DoIiwgdMYkA9uFFTRWuOhOrP7SXWYe8lJPDM.w9mulPW', 'user');  -- Mot de passe: nathantDubois1234



-- New alter table for events, add "status"
ALTER TABLE events ADD COLUMN status VARCHAR(20) DEFAULT 'draft';