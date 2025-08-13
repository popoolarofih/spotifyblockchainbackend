const supabase = {
  from: jest.fn(() => supabase),
  select: jest.fn(() => supabase),
  insert: jest.fn(() => supabase),
  update: jest.fn(() => supabase),
  eq: jest.fn(() => supabase),
  limit: jest.fn(() => supabase),
  single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
};

module.exports = supabase;
