// Simple in-memory data store for demo purposes only

const buses = new Map();
const drivers = new Map();
const schedules = new Map();

function generateId(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function toArray(map) {
  return Array.from(map.values());
}

module.exports = {
  buses,
  drivers,
  schedules,
  generateId,
  toArray,
};
