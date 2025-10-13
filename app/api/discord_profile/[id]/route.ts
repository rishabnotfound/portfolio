import { NextResponse } from 'next/server';
import { bot_token } from '../../../../config.js'

const canary_api = `https://canary.discord.com`;
const lanyard_api = `https://api.lanyard.rest`;
const cdn_discord = `https://cdn.discordapp.com`;

// Discord User Flags
let USER_FLAGS = [{
    flag: "DISCORD_EMPLOYEE",
    bitwise: 1 << 0
},
{
    flag: "PARTNERED_SERVER_OWNER",
    bitwise: 1 << 1
},
{
    flag: "HYPESQUAD_EVENTS",
    bitwise: 1 << 2
},
{
    flag: "BUGHUNTER_LEVEL_1",
    bitwise: 1 << 3
},
{
    flag: "HOUSE_BRAVERY",
    bitwise: 1 << 6
},
{
    flag: "HOUSE_BRILLIANCE",
    bitwise: 1 << 7
},
{
    flag: "HOUSE_BALANCE",
    bitwise: 1 << 8
},
{
    flag: "EARLY_SUPPORTER",
    bitwise: 1 << 9
},
{
    flag: "TEAM_USER",
    bitwise: 1 << 10
},
{
    flag: "BUGHUNTER_LEVEL_2",
    bitwise: 1 << 14
},
{
    flag: "VERIFIED_BOT",
    bitwise: 1 << 16
},
{
    flag: "EARLY_VERIFIED_BOT_DEVELOPER",
    bitwise: 1 << 17
},
{
    flag: "DISCORD_CERTIFIED_MODERATOR",
    bitwise: 1 << 18
},
{
    flag: "BOT_HTTP_INTERACTIONS",
    bitwise: 1 << 19
},
{
    flag: "SPAMMER",
    bitwise: 1 << 20
},
{
    flag: "ACTIVE_DEVELOPER",
    bitwise: 1 << 22
},
{
    flag: "QUARANTINED",
    bitwise: 17592186044416
}
];

const PREMIUM_TYPES: { [key: number]: string } = {
  0: 'None',
  1: 'Nitro Classic',
  2: 'Nitro',
  3: 'Nitro Basic',
};

const VALID_SNOWFLAKE_REGEX = /^\d{17,20}$/

function snowflakeToDate(id: string) {
    let temp = parseInt(id).toString(2);
    let length = 64 - temp.length;

    if (length > 0)
        for (let i = 0; i < length; i++)
            temp = "0" + temp;

    temp = temp.substring(0, 42)
    let date = new Date(parseInt(temp, 2) + 1420070400000)

    return date;
}

function checkValidSnowflake(id: string) {
    if (VALID_SNOWFLAKE_REGEX.test(id)) return id;
    else return 'Invalid Discord ID';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  const id = checkValidSnowflake(paramId);

  if (id === 'Invalid Discord ID') {
    return NextResponse.json(
      { message: 'Value is not a valid Discord snowflake' },
      { status: 400 }
    );
  }

  try {
    // Fetch user data from Discord API
    const userResponse = await fetch(
      `${canary_api}/api/v10/users/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${bot_token}`,
        },
        next: { revalidate: 10800 },
      }
    );

    const json = await userResponse.json();

    //console.log('User data:', json)

    if (json.message) {
      return NextResponse.json(json, { status: userResponse.status });
    }

    // Get presence from Lanyard API
    let presence = null;
    let lanyardDiscordUser = null;
    try {
      const lanyardResponse = await fetch(
        `${lanyard_api}/v1/users/${id}`,
        {
          next: { revalidate: 0 },
        }
      );

      if (lanyardResponse.ok) {
        const lanyardData = await lanyardResponse.json();

        if (lanyardData.success && lanyardData.data) {
          const data = lanyardData.data;

          // Store discord_user data for clan/guild info
          lanyardDiscordUser = data.discord_user;

          // Deduplicate activities by name + type combination
          const uniqueActivities: any[] = [];
          const seenActivities = new Map<string, any>();

          for (const activity of (data.activities || [])) {
            const key = `${activity.name}-${activity.type}`;

            // If we haven't seen this activity type/name combo, add it
            if (!seenActivities.has(key)) {
              seenActivities.set(key, activity);
              uniqueActivities.push(activity);
            } else {
              // If we've seen it, keep the one with more recent timestamp
              const existing = seenActivities.get(key);
              if (activity.created_at > existing.created_at) {
                // Replace the existing one with the newer one
                const index = uniqueActivities.findIndex(a => a.id === existing.id);
                if (index !== -1) {
                  uniqueActivities[index] = activity;
                  seenActivities.set(key, activity);
                }
              }
            }
          }

          presence = {
            discord_status: data.discord_status,
            activities: uniqueActivities,
            active_on_discord_web: data.active_on_discord_web || false,
            active_on_discord_desktop: data.active_on_discord_desktop || false,
            active_on_discord_mobile: data.active_on_discord_mobile || false,
            active_on_discord_embedded: data.active_on_discord_embedded || false,
            listening_to_spotify: data.listening_to_spotify || false,
            spotify: data.spotify || null,
            kv: data.kv || {},
          };
        }
      }
    } catch (presenceErr) {
      //console.log('Could not fetch presence from Lanyard:', presenceErr);
      // Continue without presence data
    }

    // Parse public flags
    const publicFlags: string[] = [];
    USER_FLAGS.forEach((flag) => {
      if (json.public_flags & flag.bitwise) {
        publicFlags.push(flag.flag);
      }
    });

    // Build avatar link
    let avatarLink = null;
    if (json.avatar) {
      avatarLink = `${cdn_discord}/avatars/${json.id}/${json.avatar}`;
    }

    // Build banner link
    let bannerLink = null;
    if (json.banner) {
      bannerLink = `${cdn_discord}/banners/${json.id}/${json.banner}?size=480`;
    }

    // Format output
    const output = {
      id: json.id,
      created_at: snowflakeToDate(json.id),
      username: json.username,
      avatar: {
        id: json.avatar,
        link: avatarLink,
        is_animated:
          json.avatar != null && json.avatar.startsWith('a_') ? true : false,
      },
      banner: {
        id: json.banner,
        link: bannerLink,
        is_animated:
          json.banner != null && json.banner.startsWith('a_') ? true : false,
        color: json.banner_color,
      },
      avatar_decoration: json.avatar_decoration_data ? {
        id: json.avatar_decoration_data.asset,
        link: `${cdn_discord}/avatar-decoration-presets/${json.avatar_decoration_data.asset}.png`
       } : null,
      badges: publicFlags,
      premium_type: PREMIUM_TYPES[json.premium_type] || 'None',
      accent_color: json.accent_color,
      global_name: json.global_name,
      clan: lanyardDiscordUser?.clan || json.clan ? {
        ...(lanyardDiscordUser?.clan || json.clan),
        badge_link: lanyardDiscordUser?.clan?.badge || json.clan?.badge ?
          `${cdn_discord}/clan-badges/${(lanyardDiscordUser?.clan || json.clan).identity_guild_id}/${(lanyardDiscordUser?.clan || json.clan).badge}.png` : null
      } : null,
      primary_guild: lanyardDiscordUser?.primary_guild || json.primary_guild ? {
        ...(lanyardDiscordUser?.primary_guild || json.primary_guild),
        badge_link: lanyardDiscordUser?.primary_guild?.badge || json.primary_guild?.badge ?
          `${cdn_discord}/clan-badges/${(lanyardDiscordUser?.primary_guild || json.primary_guild).identity_guild_id}/${(lanyardDiscordUser?.primary_guild || json.primary_guild).badge}.png` : null
      } : null,
      presence: presence,
    };

    return NextResponse.json(output);
  } catch (err) {
    console.error('Error fetching Discord profile:', err);
    return NextResponse.json(
      { message: 'Failed to fetch Discord profile', error: String(err) },
      { status: 500 }
    );
  }
}
