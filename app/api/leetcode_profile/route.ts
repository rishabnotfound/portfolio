import { NextResponse } from 'next/server';
import { leetcode_username } from '@/config';

const leetcode_baseurl = `https://leetcode.com`

//CSFR COOKIE NO LONGER REQUIRED  
async function getCsrfToken() {
  try {
    const response = await fetch(`${leetcode_baseurl}/graphql/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
        'Origin': leetcode_baseurl,
        'Referer': `${leetcode_baseurl}/`
      }
    });
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(', ');
      const csrfCookie = cookies.find(cookie => cookie.includes('csrftoken='));
      if (csrfCookie) {
        const csrfToken = csrfCookie.split(';')[0];
        return csrfToken
      } else {
        console.log('fucked up');
      }
    } else {
      console.log('cooked');
    }
  } catch (error) {
    console.error('bye');
  }
}

//const csrfToken = await getCsrfToken();

export async function GET() {
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          githubUrl
          twitterUrl
          linkedinUrl
          profile {
            ranking
            userAvatar
            realName
            aboutMe
            countryName
            reputation
            solutionCount
            postViewCount
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;

    const response = await fetch(`${leetcode_baseurl}/graphql/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
        'Origin': leetcode_baseurl,
        'Referer': `${leetcode_baseurl}/`,
      },
      body: JSON.stringify({
        query,
        variables: {
          username: leetcode_username,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LeetCode data');
    }

    const data = await response.json();

    if (!data.data || !data.data.matchedUser) {
      throw new Error('Invalid LeetCode response');
    }

    const user = data.data.matchedUser;

    let totalSolved = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;

    if (user.submitStats && user.submitStats.acSubmissionNum) {
      user.submitStats.acSubmissionNum.forEach((item: any) => {
        if (item.difficulty === 'All') {
          totalSolved = item.count;
        } else if (item.difficulty === 'Easy') {
          easy = item.count;
        } else if (item.difficulty === 'Medium') {
          medium = item.count;
        } else if (item.difficulty === 'Hard') {
          hard = item.count;
        }
      });
    }

    const formattedData = {
      username: user.username,
      ranking: user.profile.ranking,
      reputation: user.profile.reputation,
      solutionCount: user.profile.solutionCount,
      totalSolved,
      easy,
      medium,
      hard,
      avatar: user.profile.userAvatar,
      realName: user.profile.realName,
      aboutMe: user.profile.aboutMe,
      country: user.profile.countryName,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch LeetCode profile',
        ranking: 0,
        totalSolved: 0,
        reputation: 0,
      },
      { status: 500 }
    );
  }
}
