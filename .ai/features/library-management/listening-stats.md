# Feature: Listening Stats

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Spotify Wrapped-style listening statistics showing annual, monthly, and all-time listening habits. Displays top artists, songs, genres, total listening time, and interesting insights about music preferences.

## User Stories
- As a user, I want to see my top songs and artists so that I can reflect on my listening habits
- As a user, I want to know my total listening time so that I understand how much I listen to music
- As a user, I want to see monthly trends so that I can track how my tastes change
- As a user, I want to share my listening stats so that I can show friends my music taste

## Acceptance Criteria
- [ ] Track play events with timestamps
- [ ] Dashboard showing listening statistics
- [ ] Time range filters: Today, Week, Month, Year, All Time
- [ ] Top 10 artists, songs, albums, genres
- [ ] Total listening time and average per day
- [ ] Listening streaks and milestones
- [ ] Hourly/daily listening patterns
- [ ] New discoveries vs. familiar songs ratio
- [ ] Shareable summary images (optional)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Track play events
- **New components:**
  - `frontend/src/components/Stats/StatsPage.tsx` - Main stats page
  - `frontend/src/components/Stats/TopItems.tsx` - Top artists/songs lists
  - `frontend/src/components/Stats/ListeningChart.tsx` - Time-based charts
  - `frontend/src/components/Stats/StatCard.tsx` - Individual stat display
  - `frontend/src/components/Stats/ListeningPatterns.tsx` - Heatmap visualization
  - `frontend/src/components/Stats/StatsShareCard.tsx` - Shareable summary
- **State changes:**
  - None (data comes from API)

### Stats Page Component
```typescript
// StatsPage.tsx
function StatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/stats?range=${timeRange}`)
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <EmptyState message="No listening data yet" />;

  return (
    <div className="stats-page p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Listening Stats</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Listening Time"
          value={formatDuration(stats.totalTime)}
          icon={<Clock />}
        />
        <StatCard
          label="Songs Played"
          value={stats.totalPlays.toLocaleString()}
          icon={<Music />}
        />
        <StatCard
          label="Different Artists"
          value={stats.uniqueArtists}
          icon={<Users />}
        />
        <StatCard
          label="Avg. per Day"
          value={formatDuration(stats.avgPerDay)}
          icon={<TrendingUp />}
        />
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <TopItems
          title="Top Artists"
          items={stats.topArtists}
          valueLabel="plays"
        />
        <TopItems
          title="Top Songs"
          items={stats.topSongs}
          valueLabel="plays"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <ListeningChart
          title="Listening Over Time"
          data={stats.dailyListening}
        />
        <ListeningPatterns
          title="When You Listen"
          data={stats.hourlyPatterns}
        />
      </div>

      {/* Insights */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Insights</h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.insights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Top Items Component
```typescript
// TopItems.tsx
interface TopItem {
  rank: number;
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  value: number;
  trend?: 'up' | 'down' | 'same';  // Compared to previous period
}

function TopItems({ title, items, valueLabel }: TopItemsProps) {
  return (
    <div className="bg-bg-secondary rounded-lg p-4">
      <h3 className="font-bold mb-4">{title}</h3>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="w-6 text-text-muted font-medium">
              {index + 1}
            </span>
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                className="w-10 h-10 rounded"
                alt={item.name}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              {item.subtitle && (
                <p className="text-sm text-text-secondary truncate">
                  {item.subtitle}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium">{item.value}</p>
              <p className="text-xs text-text-muted">{valueLabel}</p>
            </div>
            {item.trend && (
              <TrendIndicator direction={item.trend} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

### Listening Patterns Heatmap
```typescript
// ListeningPatterns.tsx
function ListeningPatterns({ data }: ListeningPatternsProps) {
  // data is 7 days x 24 hours matrix of play counts

  const maxValue = Math.max(...data.flat());

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
  );

  return (
    <div className="bg-bg-secondary rounded-lg p-4">
      <h3 className="font-bold mb-4">When You Listen</h3>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
        {/* Header row */}
        <div />
        {hours.filter((_, i) => i % 3 === 0).map(hour => (
          <div key={hour} className="text-xs text-text-muted col-span-3 text-center">
            {hour}
          </div>
        ))}

        {/* Data rows */}
        {days.map((day, dayIndex) => (
          <React.Fragment key={day}>
            <div className="text-xs text-text-muted pr-2">{day}</div>
            {data[dayIndex].map((value, hourIndex) => (
              <div
                key={hourIndex}
                className="h-4 rounded-sm"
                style={{
                  backgroundColor: value === 0
                    ? 'var(--color-bg-tertiary)'
                    : `rgba(99, 102, 241, ${0.2 + (value / maxValue) * 0.8})`
                }}
                title={`${value} plays`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/stats.service.ts` - Statistics calculation
- **New endpoints:**
  - `GET /api/stats` - Get listening statistics
  - `GET /api/stats/wrapped/:year` - Get yearly wrapped summary

### Play Tracking
```typescript
// Track plays in player store
async function recordPlay(mediaId: string) {
  await api.post('/api/plays', {
    mediaId,
    timestamp: new Date().toISOString()
  });
}

// Call when song reaches 30 seconds (counts as a play)
useEffect(() => {
  if (currentTime >= 30 && !playRecorded) {
    recordPlay(currentMediaId);
    setPlayRecorded(true);
  }
}, [currentTime]);
```

### Stats Service
```typescript
// stats.service.ts
class StatsService {
  async getStats(userId: string, range: TimeRange): Promise<ListeningStats> {
    const dateRange = this.getDateRange(range);

    const plays = await prisma.play.findMany({
      where: {
        userId,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: { media: true }
    });

    return {
      totalTime: this.calculateTotalTime(plays),
      totalPlays: plays.length,
      uniqueArtists: this.countUniqueArtists(plays),
      avgPerDay: this.calculateAvgPerDay(plays, dateRange),
      topArtists: this.getTopArtists(plays, 10),
      topSongs: this.getTopSongs(plays, 10),
      topAlbums: this.getTopAlbums(plays, 10),
      topGenres: this.getTopGenres(plays, 5),
      dailyListening: this.getDailyListening(plays, dateRange),
      hourlyPatterns: this.getHourlyPatterns(plays),
      insights: this.generateInsights(plays)
    };
  }

  private getTopArtists(plays: PlayWithMedia[], limit: number): TopItem[] {
    const artistCounts = new Map<string, { count: number; media: Media }>();

    for (const play of plays) {
      const artist = play.media.artist;
      const current = artistCounts.get(artist);
      if (current) {
        current.count++;
      } else {
        artistCounts.set(artist, { count: 1, media: play.media });
      }
    }

    return Array.from(artistCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([artist, data], index) => ({
        rank: index + 1,
        id: artist,
        name: artist,
        imageUrl: data.media.albumArtPath,
        value: data.count
      }));
  }

  private generateInsights(plays: PlayWithMedia[]): Insight[] {
    const insights: Insight[] = [];

    // Most played day of week
    const dayOfWeekCounts = this.countByDayOfWeek(plays);
    const topDay = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'top-day',
      title: 'Peak Day',
      description: `You listen most on ${topDay[0]}s`,
      value: topDay[1]
    });

    // Most listened hour
    const hourCounts = this.countByHour(plays);
    const topHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'top-hour',
      title: 'Peak Hour',
      description: `Your favorite time to listen is ${formatHour(parseInt(topHour[0]))}`,
      value: topHour[1]
    });

    // Listening streak
    const currentStreak = this.calculateStreak(plays);
    insights.push({
      id: 'streak',
      title: 'Current Streak',
      description: `You've listened ${currentStreak} days in a row`,
      value: currentStreak
    });

    return insights;
  }
}
```

### Database Changes
```prisma
model Play {
  id        String   @id @default(cuid())
  mediaId   String
  media     Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  timestamp DateTime @default(now())
  duration  Int?     // Seconds listened (for skip detection)

  @@index([mediaId])
  @@index([timestamp])
}
```

## Dependencies
- **Requires:** Play tracking infrastructure
- **Blocks:** None

## Insights Examples
- "You discovered 45 new artists this month"
- "Your most played song was played 127 times"
- "You've listened to 89 hours of music this year"
- "Your taste shifted toward rock this month (+15%)"
- "Friday is your biggest listening day"
- "Night owl: 68% of your listening is after 8 PM"

## Notes
- Consider a 30-second threshold for counting plays (industry standard)
- May want to track skip rate for quality insights
- Consider offline play tracking with sync
- Could add comparison to previous period
- May want yearly "Wrapped" style summary with shareable graphics
- Consider privacy: stats should be opt-in or easily deletable
