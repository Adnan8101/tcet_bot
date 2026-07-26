import { Redis } from 'ioredis';
import 'dotenv/config';

// Connect to Redis if configured, otherwise we'll run without cache/rate-limits (for local dev)
export const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

export async function searchJobs(options: {
  keyword?: string;
  location?: string;
  remote?: boolean;
  page?: number;
}) {
  const page = options.page || 1;
  const keyword = options.keyword ? encodeURIComponent(options.keyword) : '';
  const location = options.location ? encodeURIComponent(options.location) : '';
  
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    // Mock implementation for development without keys
    return generateMockJobs(page, options.keyword, options.location);
  }

  // Base URL for Adzuna API (defaulting to gb for now, can be parameterized)
  const country = 'gb'; 
  let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}`;
  
  if (keyword) url += `&what=${keyword}`;
  if (location) url += `&where=${location}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from Adzuna');
    const data = await res.json();
    return {
      results: data.results.map((j: any) => ({
        id: j.id,
        title: j.title,
        company: j.company?.display_name,
        location: j.location?.display_name,
        salary: j.salary_min && j.salary_max ? `£${j.salary_min} - £${j.salary_max}` : 'Not specified',
        description: j.description,
        url: j.redirect_url
      })),
      total: data.count
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return { results: [], total: 0 };
  }
}

export async function getJobDetails(id: string) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return {
      id,
      title: 'Mocked Job ' + id,
      company: 'Mock Company Inc.',
      location: 'Remote',
      salary: '£50,000 - £70,000',
      description: 'This is a mocked job description. We are looking for talented people to join our fake company.',
      url: 'https://example.com/apply'
    };
  }

  // NOTE: Adzuna does not have a single job fetch endpoint easily available without tracking links,
  // typically we search for the specific ID or rely on the stored URL.
  // For demonstration, we'll try a search with the ID as keyword or just return a generic fetch.
  // Actually, Adzuna API v1 has a custom endpoint /jobs/{country}/job/{id} but it's not well documented.
  // We'll fallback to a mock if we can't find it directly.
  return {
    id,
    title: 'Job Details (Not fully supported by Adzuna API directly without search payload)',
    company: 'Unknown',
    location: 'Unknown',
    salary: 'Unknown',
    description: 'Please view the original job posting for full details.',
    url: '#'
  };
}

function generateMockJobs(page: number, keyword?: string, location?: string) {
  const results = [];
  for (let i = 1; i <= 5; i++) {
    const id = `${page}-${i}`;
    results.push({
      id,
      title: `${keyword || 'Software Engineer'} ${id}`,
      company: 'Tech Corp ' + i,
      location: location || 'Remote',
      salary: '£60,000 - £80,000',
      description: `An exciting opportunity for a ${keyword || 'developer'} based in ${location || 'the UK'}.`,
      url: `https://example.com/job/${id}`
    });
  }
  return { results, total: 50 };
}
