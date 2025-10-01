// MongoDB initialization script
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('petrol-pump-pos');

// Create application user
db.createUser({
  user: 'petroluser',
  pwd: 'petrolpos123',
  roles: [
    {
      role: 'readWrite',
      db: 'petrol-pump-pos'
    }
  ]
});

print('MongoDB initialization completed');