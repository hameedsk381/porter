db.auth('admin', 'password123');
db = db.getSiblingDB('porter-logistics');
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [
    {
      role: 'readWrite',
      db: 'porter-logistics',
    },
  ],
});
