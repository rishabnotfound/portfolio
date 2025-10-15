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

    const reposResponse = await fetch(
      `${api_github}/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers,
        next: { revalidate: 3600 }
      }
    );

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const repos = await reposResponse.json();

    const filteredRepos = repos.filter((repo: any) => !repo.fork && !repo.archived);

    // Fetch commit counts and README images for each repo
    const formattedRepos = await Promise.all(
      filteredRepos.map(async (repo: any) => {
        try {
          // Fetch commit count
          const commitsResponse = await fetch(
            `${api_github}/repos/${username}/${repo.name}/commits?per_page=1`,
            {
              headers,
              next: { revalidate: 3600 }
            }
          );

          let commitCount = 0;
          if (commitsResponse.ok) {
            const linkHeader = commitsResponse.headers.get('Link');
            if (linkHeader) {
              const match = linkHeader.match(/page=(\d+)>; rel="last"/);
              commitCount = match ? parseInt(match[1]) : 1;
            } else {
              const commits = await commitsResponse.json();
              commitCount = commits.length;
            }
          }

          // Fetch README to extract image
          let imageUrl = null;
          try {
            const readmeResponse = await fetch(
              `${api_github}/repos/${username}/${repo.name}/readme`,
              {
                headers,
                next: { revalidate: 3600 }
              }
            );

            if (readmeResponse.ok) {
              const readmeData = await readmeResponse.json();
              const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');

              // Extract first image from markdown (looking for ![alt](url) or <img> tags)
              const markdownImageMatch = readmeContent.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
              const htmlImageMatch = readmeContent.match(/src=["'](https?:\/\/[^"']+)["']/);

              if (markdownImageMatch) {
                imageUrl = markdownImageMatch[1];
              } else if (htmlImageMatch) {
                imageUrl = htmlImageMatch[1];
              }
            }
          } catch (readmeError) {
            // If README fetch fails, continue without image
          }

          return {
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
            commits: commitCount,
            image: imageUrl,
          };
        } catch (error) {
          return {
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
            commits: 0,
            image: null,
          };
        }
      })
    );

    return NextResponse.json(formattedRepos);
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}
