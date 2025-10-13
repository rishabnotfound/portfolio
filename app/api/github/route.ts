import { NextResponse } from 'next/server';
import { github_username } from '@/config';

const api_github = `https://api.github.com`

export async function GET() {
  try {
    const username = github_username;

    const reposResponse = await fetch(
      `${api_github}/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 } 
      }
    );

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const repos = await reposResponse.json();

    const formattedRepos = repos
      .filter((repo: any) => !repo.fork && !repo.archived)
      .map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        homepage: repo.homepage,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
      }))
      .sort((a: any, b: any) => b.stars - a.stars)
      .slice(0, 6);

    return NextResponse.json(formattedRepos);
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}
