import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ckroqhkrwzeebxlqhdoo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcm9xaGtyd3plZWJ4bHFoZG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMzA0MjcsImV4cCI6MjA1MjcwNjQyN30.iqkpLiwsbPUYH6Z_2mSxHxXNnryuZUZpDqdBvjUPuPQ'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Snake_case to camelCase converter
export const toCamelCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const newObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

// CamelCase to snake_case converter
export const toSnakeCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;
  
  const newObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};
