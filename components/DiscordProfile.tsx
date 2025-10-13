'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { discord_bio, discord_pronouns, discord_userid, getEnabledBadges } from '@/config';

const cdn_discord = `https://cdn.discordapp.com`;
const media_discord = `https://media.discordapp.net`;

interface DiscordProfileData {
  id: string;
  username: string;
  global_name: string;
  created_at: string;
  avatar: {
    link: string;
    is_animated: boolean;
  };
  banner: {
    link: string;
  };
  avatar_decoration: {
    link: string;
  } | null;
  badges: string[];
  clan: {
    tag: string;
    badge_link: string;
  } | null;
  presence: {
    discord_status: string;
    activities: Array<{
      id: string;
      name: string;
      type: number;
      state?: string;
      details?: string;
      application_id?: string;
      timestamps?: {
        start?: number;
        end?: number;
      };
      assets?: {
        large_image?: string;
        large_text?: string;
        small_image?: string;
        small_text?: string;
      };
    }>;
  } | null;
}

const STATUS_COLORS = {
  online: '#23a55a',
  idle: '#f0b232',
  dnd: '#f23f43',
  offline: '#80848e',
};

export default function DiscordProfile() {
  const [profile, setProfile] = useState<DiscordProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/discord_profile/${discord_userid}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch Discord profile:', err);
        setLoading(false);
      });

    // Refresh every 5 seconds for live updates
    const interval = setInterval(() => {
      fetch(`/api/discord_profile/${discord_userid}`)
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch((err) => console.error('Failed to refresh Discord profile:', err));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 bg-[#2b2d31] rounded-lg animate-pulse" />
    );
  }

  if (!profile || !profile.avatar || !profile.avatar.link) return null;

  const statusColor = STATUS_COLORS[profile.presence?.discord_status as keyof typeof STATUS_COLORS] || STATUS_COLORS.offline;

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAssetUrl = (asset: string, applicationId?: string) => {
    if (asset.startsWith('mp:')) {
      return asset.replace('mp:', `${media_discord}/`);
    }
    return `${cdn_discord}/app-assets/${applicationId || ''}/${asset}.png`;
  };

  const getActivityLabel = (type: number) => {
    switch (type) {
      case 0: return 'Playing';
      case 1: return 'Streaming';
      case 2: return 'Listening to';
      case 3: return 'Watching';
      case 4: return 'Custom Status';
      case 5: return 'Competing in';
      default: return 'Playing';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="w-full rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br from-orange-500/30 via-pink-500/30 to-purple-500/30 p-[2px]">
        <div className="w-full rounded-[inherit] overflow-hidden relative">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-pink-500/5 to-transparent pointer-events-none" />
          <div className="relative bg-[#232428]">
            {/* Banner */}
            <div className="relative h-16 bg-gradient-to-r from-blue-500 to-purple-500">
              {profile.banner?.link && (
                <Image
                  src={profile.banner.link}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Profile Content */}
            <div className="px-4 pb-4 relative">
              {/* Avatar with Status */}
              <div className="relative -mt-12 mb-3">
                <div className="relative w-20 h-20 rounded-full border-[6px] border-[#232428] bg-[#232428]">
                  <Image
                    src={profile.avatar.link}
                    alt={profile.username}
                    fill
                    className="rounded-full"
                  />
                  {profile.avatar_decoration && (
                    <div className="absolute -inset-3">
                      <Image
                        src={profile.avatar_decoration.link}
                        alt="Decoration"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full border-[4px] border-[#232428]"
                    style={{ backgroundColor: statusColor }}
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white text-xl font-bold">{profile.global_name}</h3>
                  {profile.clan && (
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <Image
                        src={profile.clan.badge_link}
                        alt={profile.clan.tag}
                        width={16}
                        height={16}
                      />
                      <span>{profile.clan.tag}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-gray-300 text-sm">{profile.username}</p>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">{discord_pronouns}</span>
                  {/* Custom Badges (from config) */}
                  <div className="flex items-center gap-1">
                    {getEnabledBadges().map((badge) => (
                      <Image
                        key={badge.name}
                        src={badge.iconUrl}
                        alt={badge.name}
                        width={18}
                        height={18}
                        title={badge.tooltip || badge.name}
                        className="inline-block"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#3f4147] mb-3" />

              {/* Custom Status */}
              <div className="mb-3">
                <p className="text-gray-400 text-sm">{discord_bio}</p>
              </div>

              {/* Member Since */}
              <div className="mb-4">
                <p className="text-white text-xs font-semibold mb-1">Member Since</p>
                <p className="text-gray-400 text-sm">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Activities */}
              <div className="space-y-3">
                {profile.presence?.activities?.map((activity, index) => {
                  const isPaused = activity.assets?.small_text?.toLowerCase().includes('paused');
                  const activityLabel = activity.type === 2 ? `Listening to ${activity.name}` : getActivityLabel(activity.type);

                  return (
                    <div key={activity.id || index} className="bg-[#1e1f22] rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white text-xs font-semibold">{activityLabel}</p>
                        <button className="text-gray-400 hover:text-white">⋯</button>
                      </div>
                      <div className="flex gap-3">
                        {activity.assets?.large_image && (
                          <div className="relative w-14 h-14 flex-shrink-0">
                            <Image
                              src={getAssetUrl(activity.assets.large_image, activity.application_id)}
                              alt={activity.name}
                              fill
                              className={`object-cover ${activity.type === 2 ? 'rounded' : 'rounded'}`}
                            />
                            {activity.assets?.small_image && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-[#1e1f22]">
                                <Image
                                  src={getAssetUrl(activity.assets.small_image, activity.application_id)}
                                  alt="Small icon"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
    
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {activity.type === 2 ? (
                            <>
                              <p className="text-white text-sm font-semibold truncate">{activity.details}</p>
                              <p className="text-gray-400 text-xs truncate">by {activity.state}</p>
                              {activity.assets?.large_text && (
                                <p className="text-gray-400 text-xs truncate">{activity.assets.large_text}</p>
                              )}
                              {activity.timestamps?.start && !isPaused && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 tabular-nums">
                                    {formatTimestamp(activity.timestamps.start)}
                                  </span>
                                  <div className="flex-1 h-1 bg-[#4e5058] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-white rounded-full transition-all duration-1000"
                                      style={{
                                        width: activity.timestamps.end
                                          ? `${Math.min(100, ((Date.now() - activity.timestamps.start) / (activity.timestamps.end - activity.timestamps.start)) * 100)}%`
                                          : '0%',
                                      }}
                                    />
                                  </div>
                                  {activity.timestamps.end && (
                                    <span className="text-[10px] text-gray-400 tabular-nums">
                                      {(() => {
                                        const total = activity.timestamps.end - activity.timestamps.start;
                                        const mins = Math.floor(total / 60000);
                                        const secs = Math.floor((total % 60000) / 1000);
                                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                                      })()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-white text-sm font-semibold truncate">{activity.name}</p>
                              {activity.details && (
                                <p className="text-gray-400 text-xs truncate">{activity.details}</p>
                              )}
                              {activity.state && (
                                <p className="text-gray-400 text-xs truncate">{activity.state}</p>
                              )}
                            </>
                          )}
                          {activity.timestamps?.start && !isPaused && (
                            <div className="flex items-center gap-1 mt-1">
                              <svg
                                aria-hidden="true"
                                role="img"
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="#23a55a"
                                  fillRule="evenodd"
                                  d="M20.97 4.06c0 .18.08.35.24.43.55.28.9.82 1.04 1.42.3 1.24.75 3.7.75 7.09v4.91a3.09 3.09 0 0 1-5.85 1.38l-1.76-3.51a1.09 1.09 0 0 0-1.23-.55c-.57.13-1.36.27-2.16.27s-1.6-.14-2.16-.27c-.49-.11-1 .1-1.23.55l-1.76 3.51A3.09 3.09 0 0 1 1 17.91V13c0-3.38.46-5.85.75-7.1.15-.6.49-1.13 1.04-1.4a.47.47 0 0 0 .24-.44c0-.7.48-1.32 1.2-1.47l2.93-.62c.5-.1 1 .06 1.36.4.35.34.78.71 1.28.68a42.4 42.4 0 0 1 4.4 0c.5.03.93-.34 1.28-.69.35-.33.86-.5 1.36-.39l2.94.62c.7.15 1.19.78 1.19 1.47ZM20 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 7a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2H7v1a1 1 0 1 1-2 0v-1H4a1 1 0 1 1 0-2h1V7Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-[#23a55a] text-xs font-semibold">
                                {formatTimestamp(activity.timestamps.start)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
