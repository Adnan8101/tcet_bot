import { Redis } from 'ioredis';
import 'dotenv/config';

// Connect to Redis if configured, otherwise we'll run without cache/rate-limits (for local dev)
export const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
}

// Adzuna's public API has no reliable single-job-by-id endpoint, so we remember
// job details returned from a search and serve /job-details and /save-job from
// that cache. Falls back to an in-memory map when Redis isn't configured.
const JOB_DETAILS_TTL_SECONDS = 60 * 60; // 1 hour
const localJobCache = new Map<string, { job: JobResult; expiresAt: number }>();

async function cacheJobDetails(job: JobResult): Promise<void> {
  if (redis) {
    await redis.set(`job_details:${job.id}`, JSON.stringify(job), 'EX', JOB_DETAILS_TTL_SECONDS);
  } else {
    localJobCache.set(job.id, { job, expiresAt: Date.now() + JOB_DETAILS_TTL_SECONDS * 1000 });
  }
}

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
    const results: JobResult[] = data.results.map((j: any) => ({
      id: String(j.id),
      title: j.title,
      company: j.company?.display_name,
      location: j.location?.display_name,
      salary: j.salary_min && j.salary_max ? `£${j.salary_min} - £${j.salary_max}` : 'Not specified',
      description: j.description,
      url: j.redirect_url
    }));
    await Promise.all(results.map(cacheJobDetails));
    return { results, total: data.count };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return { results: [], total: 0 };
  }
}

export async function getJobDetails(id: string): Promise<JobResult | null> {
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

  // Adzuna has no reliable single-job-by-id endpoint, so we rely on details cached
  // from a prior /browse-jobs search (see cacheJobDetails above). If the job was
  // never searched for in this window, or the cache entry expired, we have no data.
  if (redis) {
    const cached = await redis.get(`job_details:${id}`);
    return cached ? (JSON.parse(cached) as JobResult) : null;
  }
  const entry = localJobCache.get(id);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    localJobCache.delete(id);
    return null;
  }
  return entry.job;
}

function generateMockJobs(page: number, keyword?: string, location?: string) {
  const results: JobResult[] = [];
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
