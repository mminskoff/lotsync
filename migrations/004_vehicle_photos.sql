-- Vehicle photos + richer test inventory display data

ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE vehicles
SET
    year = 2023,
    make = 'Honda',
    model = 'Accord',
    trim = 'Sport',
    displayed_price = 28950.00,
    image_url = 'https://images.unsplash.com/photo-1623869675781-14aaede03b8f?w=800&auto=format&fit=crop&q=80'
WHERE vin = '1HGBH41JXMN109186';

UPDATE vehicles
SET
    year = 2022,
    make = 'Toyota',
    model = 'RAV4',
    trim = 'XLE',
    displayed_price = 32400.00,
    image_url = 'https://images.unsplash.com/photo-1519641471654-76ce6897a041?w=800&auto=format&fit=crop&q=80'
WHERE vin = 'TESTVIN002';
