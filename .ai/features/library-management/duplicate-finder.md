# Feature: Duplicate Finder

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Scan library for duplicate songs and help users merge or remove them. Identifies duplicates by audio fingerprint, metadata similarity, or file hash. Frees up storage and keeps library organized.

## User Stories
- As a user, I want to find duplicate songs so that I can free up storage space
- As a user, I want to see why songs are considered duplicates so that I can verify before deleting
- As a user, I want to keep the best quality version when merging duplicates
- As a user, I want to preserve playlist references when removing duplicates

## Acceptance Criteria
- [ ] Scan library for potential duplicates
- [ ] Multiple detection methods: exact hash, audio fingerprint, metadata similarity
- [ ] Group duplicates for review
- [ ] Show comparison: file size, format, bitrate, source
- [ ] Auto-select best quality version to keep
- [ ] Keep button and delete rest
- [ ] Merge: update playlist references to point to kept version
- [ ] Preview total storage savings
- [ ] Undo recent deletions (within session)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Library/` - Add duplicate finder option
- **New components:**
  - `frontend/src/components/Duplicates/DuplicateFinder.tsx` - Main interface
  - `frontend/src/components/Duplicates/DuplicateGroup.tsx` - Group of duplicates
  - `frontend/src/components/Duplicates/DuplicateComparison.tsx` - Side-by-side compare
  - `frontend/src/components/Duplicates/ScanProgress.tsx` - Scanning progress
- **State changes:**
  - Add duplicate finder state for scan results

### Duplicate Detection Methods
```typescript
interface DuplicateGroup {
  id: string;
  reason: 'exact' | 'fingerprint' | 'metadata';
  similarity: number;  // 0-100%
  songs: DuplicateSong[];
  recommendedKeep: string;  // ID of recommended song to keep
}

interface DuplicateSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileSize: number;
  format: string;
  bitrate: number;
  filePath: string;
  dateAdded: Date;
  playCount: number;
}

// Detection method scoring
function calculateSimilarity(a: Media, b: Media): number {
  let score = 0;

  // Title similarity (normalized)
  const titleSim = stringSimilarity(normalize(a.title), normalize(b.title));
  score += titleSim * 40;

  // Artist similarity
  const artistSim = stringSimilarity(normalize(a.artist), normalize(b.artist));
  score += artistSim * 30;

  // Duration within 5 seconds
  const durationDiff = Math.abs(a.duration - b.duration);
  if (durationDiff < 5) {
    score += 30 * (1 - durationDiff / 5);
  }

  return score;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### Duplicate Finder Component
```typescript
// DuplicateFinder.tsx
function DuplicateFinder() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const startScan = async () => {
    setScanning(true);
    setProgress(0);

    const eventSource = new EventSource('/api/duplicates/scan');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setProgress(data.progress);
      } else if (data.type === 'complete') {
        setGroups(data.groups);
        setScanning(false);
        eventSource.close();
      }
    };
  };

  const handleKeep = async (groupId: string, keepId: string) => {
    await api.post('/api/duplicates/resolve', {
      groupId,
      keepId,
      action: 'keep'
    });

    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleIgnore = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const totalSavings = useMemo(() => {
    return groups.reduce((sum, group) => {
      const sorted = [...group.songs].sort((a, b) => b.fileSize - a.fileSize);
      const deleteSize = sorted.slice(1).reduce((s, song) => s + song.fileSize, 0);
      return sum + deleteSize;
    }, 0);
  }, [groups]);

  return (
    <div className="duplicate-finder">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">Duplicate Finder</h1>
          <p className="text-text-secondary">
            {groups.length} potential duplicates found
            {totalSavings > 0 && ` • ${formatFileSize(totalSavings)} can be freed`}
          </p>
        </div>
        <Button onClick={startScan} disabled={scanning}>
          {scanning ? `Scanning... ${progress}%` : 'Scan Library'}
        </Button>
      </header>

      {scanning && <ProgressBar value={progress} />}

      <div className="space-y-4">
        {groups.map(group => (
          <DuplicateGroup
            key={group.id}
            group={group}
            onKeep={(keepId) => handleKeep(group.id, keepId)}
            onIgnore={() => handleIgnore(group.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Duplicate Group Component
```typescript
// DuplicateGroup.tsx
function DuplicateGroup({ group, onKeep, onIgnore }: DuplicateGroupProps) {
  const [selectedKeep, setSelectedKeep] = useState(group.recommendedKeep);

  return (
    <div className="bg-bg-secondary rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
            {group.reason === 'exact' ? 'Exact Match' :
             group.reason === 'fingerprint' ? 'Audio Match' :
             `${group.similarity}% Similar`}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onIgnore}>
            Ignore
          </Button>
          <Button size="sm" onClick={() => onKeep(selectedKeep)}>
            Keep Selected
          </Button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-muted">
            <th className="w-8"></th>
            <th>Title / Artist</th>
            <th>Format</th>
            <th>Size</th>
            <th>Quality</th>
            <th>Plays</th>
          </tr>
        </thead>
        <tbody>
          {group.songs.map(song => (
            <tr
              key={song.id}
              className={cn(
                'border-t border-border cursor-pointer hover:bg-bg-tertiary',
                selectedKeep === song.id && 'bg-accent/10'
              )}
              onClick={() => setSelectedKeep(song.id)}
            >
              <td className="py-2">
                <input
                  type="radio"
                  checked={selectedKeep === song.id}
                  onChange={() => setSelectedKeep(song.id)}
                />
              </td>
              <td>
                <p className="font-medium">{song.title}</p>
                <p className="text-text-secondary">{song.artist}</p>
              </td>
              <td>{song.format.toUpperCase()}</td>
              <td>{formatFileSize(song.fileSize)}</td>
              <td>{song.bitrate}kbps</td>
              <td>{song.playCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedKeep !== group.recommendedKeep && (
        <p className="text-sm text-text-muted mt-2">
          Recommended: Keep the {formatFileSize(group.songs.find(s => s.id === group.recommendedKeep)?.fileSize || 0)} version (best quality)
        </p>
      )}
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/duplicate.service.ts` - Duplicate detection logic
- **New endpoints:**
  - `GET /api/duplicates/scan` - SSE endpoint for scanning
  - `POST /api/duplicates/resolve` - Resolve a duplicate group

### Duplicate Detection Service
```typescript
// duplicate.service.ts
import crypto from 'crypto';

class DuplicateService {
  async scanForDuplicates(onProgress: (p: number) => void): Promise<DuplicateGroup[]> {
    const allMedia = await prisma.media.findMany();
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < allMedia.length; i++) {
      onProgress(Math.round((i / allMedia.length) * 100));

      const media = allMedia[i];
      if (processed.has(media.id)) continue;

      const duplicates = await this.findDuplicatesOf(media, allMedia.slice(i + 1));

      if (duplicates.length > 0) {
        const allInGroup = [media, ...duplicates];
        allInGroup.forEach(m => processed.add(m.id));

        groups.push({
          id: generateId(),
          reason: this.determineReason(media, duplicates[0]),
          similarity: this.calculateSimilarity(media, duplicates[0]),
          songs: allInGroup.map(m => this.toSongInfo(m)),
          recommendedKeep: this.selectBestQuality(allInGroup).id
        });
      }
    }

    return groups;
  }

  private async findDuplicatesOf(media: Media, candidates: Media[]): Promise<Media[]> {
    const duplicates: Media[] = [];

    for (const candidate of candidates) {
      // Check exact hash
      if (await this.compareHashes(media, candidate)) {
        duplicates.push(candidate);
        continue;
      }

      // Check metadata similarity
      const similarity = calculateSimilarity(media, candidate);
      if (similarity >= 85) {
        duplicates.push(candidate);
      }
    }

    return duplicates;
  }

  private async compareHashes(a: Media, b: Media): Promise<boolean> {
    // Use cached hashes if available
    let hashA = a.fileHash;
    let hashB = b.fileHash;

    if (!hashA) {
      hashA = await this.calculateFileHash(a.filePath);
      await prisma.media.update({ where: { id: a.id }, data: { fileHash: hashA } });
    }
    if (!hashB) {
      hashB = await this.calculateFileHash(b.filePath);
      await prisma.media.update({ where: { id: b.id }, data: { fileHash: hashB } });
    }

    return hashA === hashB;
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private selectBestQuality(songs: Media[]): Media {
    // Score each song: prefer higher bitrate, larger file, more plays
    const scored = songs.map(song => ({
      song,
      score:
        (song.bitrate || 0) * 10 +
        (song.fileSize || 0) / 100000 +
        (song.playCount || 0) * 5
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].song;
  }

  async resolveDuplicate(groupId: string, keepId: string): Promise<void> {
    // Get all songs in group except the one to keep
    const group = await this.getGroup(groupId);
    const toDelete = group.songs.filter(s => s.id !== keepId);

    // Update playlist references
    for (const song of toDelete) {
      await prisma.playlistItem.updateMany({
        where: { mediaId: song.id },
        data: { mediaId: keepId }
      });
    }

    // Delete duplicate songs
    for (const song of toDelete) {
      await mediaService.deleteMedia(song.id);
    }
  }
}
```

### Database Changes
```prisma
model Media {
  // ... existing fields
  fileHash    String?   // MD5 hash for exact duplicate detection
}
```

## Dependencies
- **Requires:** Delete Songs feature
- **Blocks:** None

## Detection Accuracy

| Method | Accuracy | Speed | Use Case |
|--------|----------|-------|----------|
| File Hash (MD5) | 100% | Fast | Exact copies |
| Audio Fingerprint | ~95% | Slow | Different encodes of same song |
| Metadata Similarity | ~80% | Fast | Similar titles/artists |

## Notes
- Consider audio fingerprinting with Chromaprint/AcoustID for better detection
- May want to add visual waveform comparison
- Handle edge cases: remixes, live versions, covers
- Consider async processing for large libraries
- May want to add "Auto-resolve all" button with recommended selections
- Could show diff view for metadata differences
