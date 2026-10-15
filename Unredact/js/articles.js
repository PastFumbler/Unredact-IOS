/* English Wikipedia articles used for puzzles. Redirects are fine; missing or
 * disambiguation pages are skipped automatically. Add or remove titles freely. */
window.RED_ARTICLES = [
  // Space
  'Sun', 'Moon', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Mercury (planet)', 'Neptune', 'Uranus', 'Pluto',
  'Solar System', 'Milky Way', 'Black hole', 'Big Bang', "Halley's Comet", 'Asteroid', 'International Space Station',
  'Sputnik 1', 'Apollo 11', 'Hubble Space Telescope', 'Aurora', 'Supernova', 'Meteorite', 'Neutron star', 'Galaxy',
  // Science and technology
  'Atom', 'Electron', 'Photon', 'Molecule', 'Water', 'Oxygen', 'Hydrogen', 'Carbon', 'Gold', 'Silver', 'Iron', 'Copper',
  'Diamond', 'Electricity', 'Magnetism', 'Gravity', 'Light', 'Sound', 'Rainbow', 'Lightning', 'Theory of relativity',
  'Quantum mechanics', 'Periodic table', 'Photosynthesis', 'DNA', 'Evolution', 'Dinosaur', 'Brain', 'Heart', 'Blood',
  'Penicillin', 'Vaccine', 'Microscope', 'Telescope', 'Compass', 'Paper', 'Printing press', 'Wheel', 'Steam engine',
  'Incandescent light bulb', 'Telephone', 'Radio', 'Television', 'Internet', 'Computer', 'Smartphone', 'Car', 'Bicycle',
  'Airplane', 'Helicopter', 'Rocket', 'Robot', 'Artificial intelligence', 'Wikipedia', 'Laser', 'Electric battery',
  'Refrigerator', 'Camera', 'Clock', 'Calendar', 'Money', 'Pythagorean theorem', 'Pi', 'Mathematics', 'Geometry',
  'Alphabet', 'English language', 'Latin', 'Bacteria', 'Virus', 'Climate change', 'Ice age', 'Climate', 'Earthquake',
  'Volcano', 'Tsunami', 'Tornado', 'Tropical cyclone', 'Snow', 'Cloud', 'Geyser', 'Glacier', 'Plate tectonics',
  'Antibiotic', 'X-ray', 'Nuclear power', 'Solar energy', 'Wind power', 'Bridge', 'Lighthouse', 'Submarine',
  // Countries
  'Russia', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'United Kingdom', 'Ireland', 'Norway', 'Sweden',
  'Finland', 'Iceland', 'Poland', 'Greece', 'Turkey', 'Egypt', 'Morocco', 'Kenya', 'South Africa', 'India', 'China',
  'Japan', 'South Korea', 'Mongolia', 'Thailand', 'Vietnam', 'Indonesia', 'Australia', 'New Zealand', 'Canada',
  'United States', 'Mexico', 'Cuba', 'Brazil', 'Argentina', 'Peru', 'Chile', 'Cyprus', 'Netherlands', 'Switzerland',
  'Austria', 'Czech Republic', 'Hungary', 'Madagascar', 'Nepal', 'Jamaica',
  // Cities
  'London', 'Paris', 'Rome', 'Venice', 'Berlin', 'Vienna', 'Prague', 'Amsterdam', 'Barcelona', 'Istanbul', 'Athens',
  'Jerusalem', 'Cairo', 'Dubai', 'Beijing', 'Tokyo', 'Singapore', 'New York City', 'Los Angeles', 'Chicago',
  'San Francisco', 'Rio de Janeiro', 'Sydney', 'Moscow', 'Saint Petersburg', 'Edinburgh', 'Dublin', 'Hong Kong',
  'Mumbai', 'Cape Town', 'Nicosia', 'Las Vegas',
  // Nature and places
  'Lake Baikal', 'Nile', 'Amazon River', 'Danube', 'Mississippi River', 'Pacific Ocean', 'Atlantic Ocean',
  'Arctic Ocean', 'Mediterranean Sea', 'Dead Sea', 'Mount Everest', 'Mount Kilimanjaro', 'Alps', 'Himalayas', 'Andes',
  'Sahara', 'Antarctica', 'Arctic', 'Siberia', 'Niagara Falls', 'Great Barrier Reef', 'Grand Canyon', 'Mount Vesuvius',
  'Amazon rainforest', 'Yellowstone National Park', 'Galápagos Islands', 'Iceberg', 'Coral reef',
  // Animals and plants
  'Cat', 'Dog', 'Horse', 'Wolf', 'Brown bear', 'Polar bear', 'Tiger', 'Lion', 'Leopard', 'Cheetah', 'Giraffe', 'Zebra',
  'Kangaroo', 'Koala', 'Giant panda', 'Blue whale', 'Dolphin', 'Shark', 'Octopus', 'Penguin', 'Owl', 'Parrot',
  'Honey bee', 'Ant', 'Spider', 'Crocodile', 'Turtle', 'Camel', 'Elephant', 'Woolly mammoth', 'Red fox', 'Hedgehog',
  'Beaver', 'Salmon', 'Platypus', 'Tardigrade', 'Butterfly', 'Bat', 'Eagle', 'Sloth', 'Gorilla', 'Chimpanzee',
  'Oak', 'Pine', 'Rose', 'Sunflower', 'Maize', 'Potato', 'Tomato', 'Apple', 'Bamboo', 'Cactus', 'Mushroom', 'Banana',
  // Food
  'Coffee', 'Tea', 'Chocolate', 'Bread', 'Honey', 'Cheese', 'Pizza', 'Sushi', 'Ice cream', 'Sugar', 'Rice', 'Pasta',
  'Hamburger', 'Popcorn', 'Vanilla',
  // People
  'Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Charles Darwin', 'Marie Curie', 'Dmitri Mendeleev',
  'Yuri Gagarin', 'Nikola Tesla', 'Thomas Edison', 'Leonardo da Vinci', 'Michelangelo', 'Vincent van Gogh',
  'Pablo Picasso', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach',
  'Pyotr Ilyich Tchaikovsky', 'William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Jules Verne', 'Mark Twain',
  'Leo Tolstoy', 'Fyodor Dostoevsky', 'Aristotle', 'Plato', 'Socrates', 'Archimedes', 'Pythagoras', 'Julius Caesar',
  'Alexander the Great', 'Peter the Great', 'Christopher Columbus', 'Ferdinand Magellan', 'Marco Polo',
  'Neil Armstrong', 'Valentina Tereshkova', 'Steve Jobs', 'Charlie Chaplin', 'Walt Disney', 'Agatha Christie',
  'Ada Lovelace', 'Cleopatra', 'Alan Turing', 'Florence Nightingale', 'Amelia Earhart', 'Frida Kahlo',
  'Stephen Hawking', 'The Beatles',
  // History and culture
  'Ancient Egypt', 'Ancient Greece', 'Ancient Rome', 'Egyptian pyramids', 'Great Wall of China', 'Colosseum',
  'Stonehenge', 'Taj Mahal', 'Eiffel Tower', 'Statue of Liberty', 'Moscow Kremlin', 'Big Ben', 'Louvre',
  'Machu Picchu', 'Angkor Wat', 'Petra', 'Atlantis', 'Vikings', 'Knight', 'Middle Ages', 'Renaissance',
  'Industrial Revolution', 'Titanic', 'Olympic Games', 'Chess', "Rubik's Cube", 'Tetris', 'Association football',
  'Basketball', 'Tennis', 'Cricket', 'Ballet', 'Opera', 'Jazz', 'Rock music', 'Film', 'Photography', 'Painting',
  'Sculpture', 'Architecture', 'Theatre', 'Circus', 'Animation', 'Mona Lisa', 'Sherlock Holmes', 'Harry Potter',
  'The Lord of the Rings', 'Don Quixote', 'The Little Prince', 'Library', 'University', 'Museum', 'Castle', 'Pirate',
  'Samurai', 'Lego', 'Video game', 'Origami', 'Halloween', 'Christmas', 'Hot air balloon'
];
