import { NextResponse } from 'next/server';
import { github_username } from '@/config';

const api_github = `https://api.github.com`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET() {
  try {
    const username = github_username;

    // Build headers with optional authentication
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    // Fetch user data and all repos in parallel
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${api_github}/users/${username}`, {
        headers,
        next: { revalidate: 3600 }
      }),
      fetch(`${api_github}/users/${username}/repos?per_page=100`, {
        headers,
        next: { revalidate: 3600 }
      })
    ]);

    if (!userResponse.ok || !reposResponse.ok) {
      throw new Error('Failed to fetch GitHub data');
    }

    const [userData, allRepos] = await Promise.all([
      userResponse.json(),
      reposResponse.json()
    ]);

    const nonForkedRepos = allRepos.filter((repo: any) => !repo.fork && !repo.archived);

    return NextResponse.json({
      followers: userData.followers || 0,
      totalRepos: nonForkedRepos.length,
      repos: allRepos
    });
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub user data' },
      { status: 500 }
    );
  }
}
