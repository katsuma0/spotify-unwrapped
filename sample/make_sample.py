#!/usr/bin/env python3
"""Generate a fake Spotify data-export zip (my_spotify_data.zip) for testing.

Mimics the real structure:
  Spotify Extended Streaming History/Streaming_History_Audio_2025-2026_0.json
  Spotify Account Data/StreamingHistory_music_0.json  (1-year simple format)
  Spotify Account Data/YourLibrary.json               (ignored by the app)
"""
import json, random, zipfile
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

ARTISTS = [
    ("Taylor Swift", 10, ["Cruel Summer", "Anti-Hero", "Style", "August"]),
    ("The Weeknd", 9, ["Blinding Lights", "Starboy", "After Hours", "Save Your Tears"]),
    ("SZA", 8, ["Kill Bill", "Snooze", "Good Days", "Nobody Gets Me"]),
    ("Kendrick Lamar", 8, ["Not Like Us", "HUMBLE.", "luther", "Money Trees"]),
    ("Billie Eilish", 7, ["BIRDS OF A FEATHER", "bad guy", "CHIHIRO", "Happier Than Ever"]),
    ("Sabrina Carpenter", 7, ["Espresso", "Please Please Please", "Taste", "Nonsense"]),
    ("Bad Bunny", 6, ["Tití Me Preguntó", "Me Porto Bonito", "DtMF", "Callaíta"]),
    ("Chappell Roan", 6, ["Good Luck, Babe!", "Pink Pony Club", "HOT TO GO!", "Red Wine Supernova"]),
    ("Arctic Monkeys", 5, ["505", "Do I Wanna Know?", "R U Mine?", "Fluorescent Adolescent"]),
    ("Frank Ocean", 5, ["Pink + White", "Nights", "Ivy", "Chanel"]),
    ("Tame Impala", 5, ["The Less I Know the Better", "Let It Happen", "Borderline", "New Person, Same Old Mistakes"]),
    ("Dua Lipa", 4, ["Levitating", "Houdini", "Don't Start Now", "Training Season"]),
    ("Hozier", 4, ["Too Sweet", "Take Me to Church", "Work Song", "Would That I"]),
    ("Fred again..", 4, ["Delilah (pull me out of this)", "Rumble", "adore u", "Marea (we've lost dancing)"]),
    ("Doja Cat", 3, ["Paint the Town Red", "Woman", "Agora Hills", "Say So"]),
    ("Zach Bryan", 3, ["Something in the Orange", "I Remember Everything", "Pink Skies", "Oklahoma Smokeshow"]),
    ("Radiohead", 3, ["Creep", "No Surprises", "Karma Police", "Weird Fishes/Arpeggi"]),
    ("Fleetwood Mac", 3, ["Dreams", "The Chain", "Everywhere", "Landslide"]),
    ("Beyoncé", 2, ["TEXAS HOLD 'EM", "CUFF IT", "Halo", "Crazy in Love"]),
    ("Daft Punk", 2, ["Get Lucky", "Instant Crush", "One More Time", "Something About Us"]),
    ("Olivia Rodrigo", 2, ["vampire", "good 4 u", "drivers license", "deja vu"]),
    ("Travis Scott", 2, ["FE!N", "goosebumps", "SICKO MODE", "MY EYES"]),
    ("Mitski", 1, ["My Love Mine All Mine", "Washing Machine Heart", "Nobody", "First Love / Late Spring"]),
    ("Gracie Abrams", 1, ["That's So True", "I Love You, I'm Sorry", "us.", "Close To You"]),
]
PLATFORMS = [
    ("iOS 18.3 (iPhone16,2)", 46), ("osx 15.2 (MacBookPro18,1)", 24),
    ("web_player windows 11", 12), ("android 15 (Pixel 9)", 10),
    ("sonos_v2", 5), ("ps5_v1", 3),
]
PODCASTS = [("The Daily", "A regular news episode"), ("Radiolab", "A curious science story"), ("Hard Fork", "This week in tech")]
HOUR_W = [3, 2, 1, 1, 1, 1, 2, 5, 9, 8, 7, 6, 7, 6, 6, 7, 9, 11, 10, 8, 8, 7, 6, 4]
DOW_W = [8, 8, 9, 9, 11, 12, 10]  # Mon..Sun


def wpick(pairs):
    total = sum(w for _, w in pairs)
    r = random.random() * total
    for item, w in pairs:
        r -= w
        if r <= 0:
            return item
    return pairs[0][0]


def main():
    artist_w = [(a, a[1]) for a in ARTISTS]
    hour_w = [(h, w) for h, w in enumerate(HOUR_W)]
    end = datetime(2026, 7, 20)
    days = 1826  # five years

    extended = []
    for d in range(days, 0, -1):
        day = end - timedelta(days=d)
        boost = DOW_W[day.weekday()] / 10
        if random.random() > 0.86 * boost:
            continue
        n_sessions = 1 + int(random.random() * 3 * boost)
        for _ in range(n_sessions):
            t = day.replace(hour=wpick(hour_w), minute=random.randrange(60), second=random.randrange(60))
            platform = wpick([(p, w) for p, w in PLATFORMS])
            session_artist = wpick(artist_w)
            for _ in range(2 + random.randrange(9)):
                art = session_artist if random.random() < 0.55 else wpick(artist_w)
                track = random.choice(art[2])
                skipped = random.random() < 0.13
                ms = random.randrange(25000) if skipped else 95000 + random.randrange(150000)
                extended.append({
                    "ts": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "username": "sample_user",
                    "platform": platform,
                    "ms_played": ms,
                    "conn_country": "CA",
                    "ip_addr_decrypted": None,
                    "master_metadata_track_name": track,
                    "master_metadata_album_artist_name": art[0],
                    "master_metadata_album_album_name": None,
                    "spotify_track_uri": "spotify:track:sample",
                    "episode_name": None,
                    "episode_show_name": None,
                    "spotify_episode_uri": None,
                    "reason_start": "trackdone",
                    "reason_end": "fwdbtn" if skipped else "trackdone",
                    "shuffle": random.random() < 0.4,
                    "skipped": skipped,
                    "offline": False,
                    "offline_timestamp": None,
                    "incognito_mode": False,
                })
                t += timedelta(milliseconds=ms + 1500)
        if random.random() < 0.18:
            show, ep = random.choice(PODCASTS)
            t = day.replace(hour=8, minute=30)
            extended.append({
                "ts": t.strftime("%Y-%m-%dT%H:%M:%SZ"), "username": "sample_user",
                "platform": "iOS 18.3 (iPhone16,2)", "ms_played": 1200000 + random.randrange(1800000),
                "conn_country": "CA", "master_metadata_track_name": None,
                "master_metadata_album_artist_name": None, "master_metadata_album_album_name": None,
                "spotify_track_uri": None, "episode_name": ep, "episode_show_name": show,
                "spotify_episode_uri": "spotify:episode:sample", "reason_start": "clickrow",
                "reason_end": "endplay", "shuffle": False, "skipped": False,
                "offline": False, "offline_timestamp": None, "incognito_mode": False,
            })

    # simple 1-year package derived from the last 365 days
    cutoff = (end - timedelta(days=365)).strftime("%Y-%m-%d")
    simple = [
        {"endTime": r["ts"][:16].replace("T", " "), "artistName": r["master_metadata_album_artist_name"],
         "trackName": r["master_metadata_track_name"], "msPlayed": r["ms_played"]}
        for r in extended if r["master_metadata_track_name"] and r["ts"][:10] >= cutoff
    ]
    library = {"tracks": [{"artist": a[0], "album": "", "track": a[2][0], "uri": "spotify:track:sample"} for a in ARTISTS]}

    out = Path(__file__).resolve().parent.parent / "my_spotify_data.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        half = len(extended) // 2
        z.writestr("Spotify Extended Streaming History/Streaming_History_Audio_2021-2024_0.json", json.dumps(extended[:half], ensure_ascii=False, indent=1))
        z.writestr("Spotify Extended Streaming History/Streaming_History_Audio_2024-2026_1.json", json.dumps(extended[half:], ensure_ascii=False, indent=1))
        z.writestr("Spotify Account Data/StreamingHistory_music_0.json", json.dumps(simple, ensure_ascii=False, indent=1))
        z.writestr("Spotify Account Data/YourLibrary.json", json.dumps(library, ensure_ascii=False, indent=1))
        z.writestr("Spotify Account Data/ReadMeFirst.pdf", b"%PDF-1.4 fake")
    print(f"wrote {out} ({out.stat().st_size:,} bytes, {len(extended):,} extended rows, {len(simple):,} simple rows)")


if __name__ == "__main__":
    main()
