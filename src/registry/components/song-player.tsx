"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Share2, X, ChevronRight } from "lucide-react";

const WAVEFORM_HEIGHTS = [
  14, 20, 10, 24, 32, 16, 20, 28, 36, 18, 22, 28, 24, 20, 14, 20, 28, 16, 22, 32, 18, 12, 24, 16, 20, 10
];

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

interface SongPlayerProps {
  defaultVideoUrl?: string;
}

export function SongPlayer({
  defaultVideoUrl = "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
}: SongPlayerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const initialId = useMemo(() => getYouTubeId(defaultVideoUrl) || "4NRXx6U8ABQ", [defaultVideoUrl]);
  const [videoId, setVideoId] = useState<string>(initialId);
  const [player, setPlayer] = useState<any>(null);

  const [trackInfo, setTrackInfo] = useState(() => {
    const isDefault = defaultVideoUrl.includes("4NRXx6U8ABQ");
    return {
      title: isDefault ? "Blinding Lights" : "YouTube Audio",
      artist: isDefault ? "The Weeknd" : "YouTube Channel",
      cover: isDefault
        ? "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?q=80&w=200&auto=format&fit=crop"
        : `https://img.youtube.com/vi/${getYouTubeId(defaultVideoUrl) || ""}/hqdefault.jpg`,
    };
  });

  const repeatRef = useRef(isRepeating);
  const cuedVideoIdRef = useRef<string | null>(null);
  useEffect(() => {
    repeatRef.current = isRepeating;
  }, [isRepeating]);

  const loadTrackInfo = useCallback(async (url: string) => {
    const id = getYouTubeId(url);
    if (!id) return;
    let title = "YouTube Audio", artist = "YouTube Channel";
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
      if (res.ok) {
        const data = await res.json();
        title = data.title || title;
        artist = data.author_name || artist;
      }
    } catch { }
    setTrackInfo({ title, artist, cover: `https://img.youtube.com/vi/${id}/hqdefault.jpg` });
    setVideoId(id);
  }, []);

  // Sync with defaultVideoUrl changes
  useEffect(() => {
    if (defaultVideoUrl) {
      loadTrackInfo(defaultVideoUrl);
    }
  }, [defaultVideoUrl, loadTrackInfo]);

  // Inject YouTube Iframe Player API and initialize
  useEffect(() => {
    const initPlayer = (vidId: string) => {
      if ((window as any).YT?.Player) {
        new (window as any).YT.Player("yt-player-iframe", {
          height: "0", width: "0", videoId: vidId,
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, showinfo: 0, iv_load_policy: 3 },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              cuedVideoIdRef.current = vidId;
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                if (repeatRef.current) {
                  event.target.seekTo(0);
                  event.target.playVideo();
                } else {
                  setIsPlaying(false);
                }
              }
            },
          },
        });
      }
    };

    if ((window as any).YT?.Player) {
      initPlayer(videoId);
    } else {
      // Only inject script once across all mounts
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => initPlayer(videoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update track when videoId changes
  useEffect(() => {
    if (player && videoId && videoId !== cuedVideoIdRef.current) {
      player.cueVideoById(videoId);
      cuedVideoIdRef.current = videoId;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(30);
    }
  }, [videoId, player]);

  // Play/Pause trigger
  useEffect(() => {
    if (!player) return;
    isPlaying ? player.playVideo?.() : player.pauseVideo?.();
  }, [isPlaying, player]);

  // Sync progress tracking
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      if (player.getCurrentTime) setCurrentTime(Math.floor(player.getCurrentTime()));
      if (player.getDuration) {
        const dur = Math.floor(player.getDuration());
        if (dur > 0) setDuration(dur);
      }
    }, isPlaying ? 500 : 1000);
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const handleLoadLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputUrl) {
      await loadTrackInfo(inputUrl);
      setInputUrl("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const springTransition = useMemo(
    () => shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 26 },
    [shouldReduceMotion]
  );

  return (
    <div className="relative flex justify-center items-center w-full max-w-[400px] font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes vinyl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .vinyl-record-spin { animation: vinyl-spin 15s linear infinite; }
        @keyframes waveform-bar {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(var(--wave-scale, 1.5)); }
        }
      ` }} />

      <div style={{ display: "none" }}><div id="yt-player-iframe" /></div>

      <AnimatePresence mode="popLayout" initial={false}>
        {isExpanded ? (
          <motion.div
            key="expanded-player" layoutId="player-card-wrapper" transition={springTransition}
            className="relative flex flex-col items-center w-[350px] bg-white text-zinc-950 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-100 rounded-2xl will-change-transform z-10"
          >
            <motion.button
              type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} aria-label="Collapse player"
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 p-1.5 rounded-full transition-colors cursor-pointer focus-visible:outline-none"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </motion.button>

            <motion.div
              layoutId="player-vinyl-container" transition={springTransition}
              className="relative flex items-center justify-center w-[240px] h-[240px] mb-6 mt-4"
            >
              <div
                style={{ animationPlayState: isPlaying ? "running" : "paused" }}
                className="vinyl-record-spin w-[218px] h-[218px] rounded-full relative shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-center bg-[radial-gradient(circle_at_center,#27272a_0%,#09090b_100%)] border-4 border-zinc-900"
              >
                {[198, 178, 158, 138, 118].map((s) => (
                  <div key={s} className="border border-zinc-800/40 rounded-full absolute" style={{ width: s, height: s }} />
                ))}

                <div className="w-[76px] h-[76px] rounded-full overflow-hidden absolute flex items-center justify-center border-2 border-zinc-950">
                  <img src={trackInfo.cover} alt={`${trackInfo.title} cover`} className="w-full h-full object-cover" />
                  <div className="w-[10px] h-[10px] bg-white border border-zinc-300 rounded-full absolute shadow-inner z-10" />
                </div>
              </div>

              <motion.svg
                width="70" height="160" viewBox="0 0 70 160"
                className="absolute right-[32px] top-[-8px] pointer-events-none z-20 origin-[35px_20px] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]"
                animate={{ rotate: isPlaying ? 24 : 5 }} transition={springTransition}
              >
                <circle cx="35" cy="20" r="14" fill="#e4e4e7" stroke="#d4d4d8" strokeWidth="2" />
                <circle cx="35" cy="20" r="6" fill="#71717a" />
                <path d="M 35 20 Q 30 70 30 135" fill="none" stroke="#d4d4d8" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 35 20 Q 30 70 30 135" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="23" y="132" width="14" height="20" rx="2" fill="#27272a" />
                <rect x="29" y="145" width="2" height="10" fill="#a1a1aa" />
                <path d="M 23 138 C 15 138 15 130 18 128" fill="none" stroke="#27272a" strokeWidth="2" />
              </motion.svg>
            </motion.div>

            <motion.h2
              layoutId="player-metadata-title" transition={springTransition}
              className="text-[20px] font-semibold tracking-tight text-zinc-900 mt-2 text-center w-full truncate px-4"
            >
              {trackInfo.title}
            </motion.h2>
            <motion.p
              layoutId="player-metadata-artist" transition={springTransition}
              className="text-[14px] text-zinc-500 font-medium mt-1 text-center w-full truncate px-4"
            >
              {trackInfo.artist}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="w-full flex items-center gap-2 mt-4"
            >
              <input
                type="url" placeholder="Paste YouTube Link..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 text-xs border border-zinc-200 bg-zinc-50 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all text-zinc-900 font-sans"
              />
              <button
                type="button" onClick={handleLoadLink}
                className="text-xs font-semibold px-3 py-2 bg-zinc-950 text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                Load
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-md p-4 mt-5 flex flex-col gap-3 shadow-inner shadow-zinc-50/50"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!player) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  const newTime = Math.floor(percent * duration);
                  player.seekTo?.(newTime);
                  setCurrentTime(newTime);
                }}
                className="flex items-end justify-center gap-[3px] h-[40px] cursor-pointer select-none"
              >
                {WAVEFORM_HEIGHTS.map((baseHeight, i) => {
                  const progressPercent = (currentTime / duration) * 100;
                  const isActive = (i / WAVEFORM_HEIGHTS.length) * 100 <= progressPercent;
                  const waveScale = 0.45 + (i % 3) * 0.12;
                  const animDuration = `${0.9 + (i % 5) * 0.12}s`;

                  return (
                    <div
                      key={i}
                      className="w-[3px] rounded-full shrink-0"
                      style={{
                        height: baseHeight,
                        backgroundColor: isActive ? "#18181b" : "#e4e4e7",
                        transformOrigin: "bottom",
                        animation: isPlaying
                          ? `waveform-bar ${animDuration} ease-in-out ${i * 0.015}s infinite alternate`
                          : "none",
                        ["--wave-scale" as string]: 1 + waveScale,
                        transition: "background-color 0.2s",
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex justify-center text-xs font-mono font-medium text-zinc-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <div className="flex items-center justify-between mt-1 px-2">
                <button
                  type="button" onClick={(e) => { e.stopPropagation(); setIsRepeating(prev => !prev); }}
                  aria-label={isRepeating ? "Disable loop" : "Enable loop"}
                  className={`p-1.5 transition-colors cursor-pointer rounded-md focus-visible:outline-none ${isRepeating ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-950"
                    }`}
                >
                  <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
                </button>

                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (player?.seekTo) {
                        const newTime = Math.max(0, currentTime - 10);
                        player.seekTo(newTime);
                        setCurrentTime(newTime);
                      }
                    }}
                    aria-label="Skip backward 10 seconds"
                    className="text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer rounded-md p-1 focus-visible:outline-none"
                  >
                    <SkipBack size={16} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  </button>

                  <motion.button
                    type="button" layoutId="player-play-pause-circle" transition={springTransition}
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(prev => !prev); }}
                    aria-label={isPlaying ? "Pause music" : "Play music"}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none shadow-md"
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" strokeWidth={0} /> : <Play size={16} className="ml-0.5" fill="currentColor" strokeWidth={0} />}
                  </motion.button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (player?.seekTo) {
                        const newTime = Math.min(duration, currentTime + 10);
                        player.seekTo(newTime);
                        setCurrentTime(newTime);
                      }
                    }}
                    aria-label="Skip forward 10 seconds"
                    className="text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer rounded-md p-1 focus-visible:outline-none"
                  >
                    <SkipForward size={16} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  </button>
                </div>

                <div className="relative flex items-center">
                  <AnimatePresence>
                    {isShared && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute bottom-full mb-2 right-0 bg-zinc-950 text-white text-[10px] px-2.5 py-1 rounded-md shadow-md pointer-events-none whitespace-nowrap z-30 font-medium"
                      >
                        Copied Link!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const shareUrl = `https://www.youtube.com/watch?v=${videoId}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: trackInfo.title,
                            text: `Listening to ${trackInfo.title} by ${trackInfo.artist}`,
                            url: shareUrl,
                          });
                          return;
                        } catch { }
                      }
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setIsShared(true);
                        setTimeout(() => setIsShared(false), 2000);
                      } catch { }
                    }}
                    aria-label="Share song link"
                    className={`p-1.5 transition-colors cursor-pointer rounded-md focus-visible:outline-none ${isShared ? "text-sky-600 bg-sky-50" : "text-zinc-400 hover:text-zinc-950"}`}
                  >
                    <Share2 size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="mini-player" layoutId="player-card-wrapper" transition={springTransition} onClick={() => setIsExpanded(true)}
            className="relative flex items-center justify-between w-[350px] bg-white text-zinc-950 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.05)] border border-zinc-100 rounded-md cursor-pointer hover:bg-zinc-50/70 transition-colors select-none will-change-transform"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <motion.div
                layoutId="player-vinyl-container" transition={springTransition}
                className="relative flex items-center justify-center w-[48px] h-[48px] shrink-0"
              >
                <div
                  style={{ animationPlayState: isPlaying ? "running" : "paused" }}
                  className="vinyl-record-spin w-[44px] h-[44px] rounded-full relative shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center justify-center bg-[radial-gradient(circle_at_center,#27272a_0%,#09090b_100%)] border-2 border-zinc-900"
                >
                  {[38, 30].map((s) => (
                    <div key={s} className="border border-zinc-800/30 rounded-full absolute" style={{ width: s, height: s }} />
                  ))}

                  <div className="w-[18px] h-[18px] rounded-full overflow-hidden absolute flex items-center justify-center border border-zinc-950">
                    <img src={trackInfo.cover} alt={`${trackInfo.title} cover`} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-[3px] h-[3px] bg-white rounded-full absolute z-10" />
                </div>
              </motion.div>

              <div className="flex flex-col min-w-0 pr-2">
                <motion.span
                  layoutId="player-metadata-title" transition={springTransition}
                  className="font-sans text-[14px] font-semibold text-zinc-900 truncate leading-none"
                >
                  {trackInfo.title}
                </motion.span>
                <motion.span
                  layoutId="player-metadata-artist" transition={springTransition}
                  className="font-sans text-[11px] text-zinc-400 mt-1 truncate leading-none"
                >
                  {trackInfo.artist}
                </motion.span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button" layoutId="player-play-pause-circle" transition={springTransition}
                onClick={(e) => { e.stopPropagation(); setIsPlaying(prev => !prev); }}
                aria-label={isPlaying ? "Pause music" : "Play music"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none shadow-md"
              >
                {isPlaying ? <Pause size={14} fill="currentColor" strokeWidth={0} /> : <Play size={14} className="ml-0.5" fill="currentColor" strokeWidth={0} />}
              </motion.button>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}
                className="flex h-7 w-7 items-center justify-center text-zinc-400"
              >
                <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
