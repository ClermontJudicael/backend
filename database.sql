CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  image_alt VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création d'un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion des événements avec images
INSERT INTO events (title, description, date, location, category, image_url, image_alt) VALUES
  ('Concert de Jazz 1',
   'Un super concert de jazz avec les meilleurs artistes',
   '2024-04-01 20:00:00',
   'Salle de Concert',
   'concert',
   '/images/events/jazz.jpg',
   'Concert de jazz avec des musiciens sur scène'),
  
  ('Match de Football 2',
   'Finale du championnat local de football',
   '2024-05-15 15:00:00',
   'Stade Municipal',
   'sport',
   '/images/events/foot.jpg',
   'Match de football en cours'),
  
  ('Pièce de Théâtre 3',
   'Une représentation exceptionnelle de "Le Misanthrope"',
   '2024-06-20 19:30:00',
   'Théâtre Municipal',
   'theatre',
   '/images/events/jazz.jpg',
   'Scène de théâtre avec les acteurs'),
  
  ('Exposition d''Art Contemporain 4',
   'Découvrez les œuvres des artistes locaux',
   '2024-07-10 10:00:00',
   'Galerie d''Art',
   'exposition',
   '/images/events/jazz.jpg',
   'Exposition d''art contemporain'),
   
   ('Match de Football 5',
   'Finale du championnat local de football',
   '2024-05-15 15:00:00',
   'Stade Municipal',
   'sport',
   '/images/events/foot.jpg',
   'Match de football en cours')
  ;
