# Feature: Smart Playlists

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Auto-generated playlists based on user-defined rules and filters. Create dynamic playlists that automatically update as your library changes, such as "Recently Added", "Most Played", "80s Rock", or custom criteria combinations.

## User Stories
- As a user, I want to create playlists based on rules so that I don't have to manually curate them
- As a user, I want smart playlists to update automatically so that new songs matching the criteria are included
- As a user, I want to combine multiple rules so that I can create specific playlists
- As a user, I want built-in smart playlists so that I can start using them immediately

## Acceptance Criteria
- [ ] Create smart playlists with rule-based criteria
- [ ] Support multiple rules with AND/OR logic
- [ ] Rules can filter by: artist, album, genre, year, duration, play count, date added, rating
- [ ] Smart playlists auto-update when library changes
- [ ] Built-in smart playlists: Recently Added, Most Played, Never Played
- [ ] Set playlist limits (max songs, total duration)
- [ ] Sort options (random, newest, most played, etc.)
- [ ] Edit rules after creation
- [ ] Preview matches before saving

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Playlists/` - Add smart playlist UI
  - `frontend/src/stores/playlistStore.ts` - Add smart playlist state
- **New components:**
  - `frontend/src/components/Playlists/SmartPlaylistEditor.tsx` - Rule builder UI
  - `frontend/src/components/Playlists/RuleBuilder.tsx` - Single rule component
  - `frontend/src/components/Playlists/RuleGroup.tsx` - AND/OR rule groups
  - `frontend/src/components/Playlists/SmartPlaylistPreview.tsx` - Preview matches
- **State changes:**
  - Add smart playlist types and queries to playlist store

### Rule Interface
```typescript
type RuleOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'inRange'
  | 'inLast'  // for dates: "in last 7 days"
  | 'notInLast';

type RuleField =
  | 'title'
  | 'artist'
  | 'album'
  | 'genre'
  | 'year'
  | 'duration'
  | 'playCount'
  | 'dateAdded'
  | 'lastPlayed'
  | 'rating';

interface Rule {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: string | number | [number, number]; // [number, number] for ranges
}

interface RuleGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: (Rule | RuleGroup)[];
}

interface SmartPlaylistDefinition {
  name: string;
  rules: RuleGroup;
  limit?: {
    type: 'songs' | 'duration';
    value: number;
  };
  sortBy: 'random' | 'dateAdded' | 'playCount' | 'title' | 'artist';
  sortDirection: 'asc' | 'desc';
}
```

### Rule Builder Component
```typescript
// RuleBuilder.tsx
function RuleBuilder({ rule, onChange, onDelete }: RuleBuilderProps) {
  const fieldOptions = [
    { value: 'artist', label: 'Artist', type: 'text' },
    { value: 'album', label: 'Album', type: 'text' },
    { value: 'genre', label: 'Genre', type: 'text' },
    { value: 'year', label: 'Year', type: 'number' },
    { value: 'duration', label: 'Duration', type: 'duration' },
    { value: 'playCount', label: 'Play Count', type: 'number' },
    { value: 'dateAdded', label: 'Date Added', type: 'date' },
    { value: 'rating', label: 'Rating', type: 'number' },
  ];

  const getOperatorsForField = (field: RuleField): RuleOperator[] => {
    switch (field) {
      case 'title':
      case 'artist':
      case 'album':
      case 'genre':
        return ['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'endsWith'];
      case 'year':
      case 'duration':
      case 'playCount':
      case 'rating':
        return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'inRange'];
      case 'dateAdded':
      case 'lastPlayed':
        return ['inLast', 'notInLast', 'greaterThan', 'lessThan'];
      default:
        return ['equals'];
    }
  };

  return (
    <div className="rule-builder flex items-center gap-2 p-2 bg-bg-secondary rounded">
      <Select value={rule.field} onChange={v => onChange({ ...rule, field: v })}>
        {fieldOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>

      <Select value={rule.operator} onChange={v => onChange({ ...rule, operator: v })}>
        {getOperatorsForField(rule.field).map(op => (
          <option key={op} value={op}>{formatOperator(op)}</option>
        ))}
      </Select>

      <RuleValueInput
        field={rule.field}
        operator={rule.operator}
        value={rule.value}
        onChange={v => onChange({ ...rule, value: v })}
      />

      <button onClick={onDelete} className="text-error">
        <Trash className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/playlist.service.ts` - Add smart playlist logic
  - `backend/src/controllers/playlist.controller.ts` - Add smart playlist endpoints
- **New services:**
  - `backend/src/services/smart-playlist.service.ts` - Rule evaluation
- **New endpoints:**
  - `POST /api/playlists/smart` - Create smart playlist
  - `GET /api/playlists/smart/:id/preview` - Preview matches
  - `GET /api/playlists/smart/:id/songs` - Get current songs matching rules

### Rule Evaluation
```typescript
// smart-playlist.service.ts
class SmartPlaylistService {
  evaluateRules(rules: RuleGroup): Prisma.MediaWhereInput {
    return this.evaluateRuleGroup(rules);
  }

  private evaluateRuleGroup(group: RuleGroup): Prisma.MediaWhereInput {
    const conditions = group.rules.map(rule => {
      if ('logic' in rule) {
        return this.evaluateRuleGroup(rule);
      }
      return this.evaluateRule(rule);
    });

    return group.logic === 'AND' ? { AND: conditions } : { OR: conditions };
  }

  private evaluateRule(rule: Rule): Prisma.MediaWhereInput {
    const { field, operator, value } = rule;

    switch (operator) {
      case 'equals':
        return { [field]: value };
      case 'notEquals':
        return { [field]: { not: value } };
      case 'contains':
        return { [field]: { contains: value, mode: 'insensitive' } };
      case 'notContains':
        return { NOT: { [field]: { contains: value, mode: 'insensitive' } } };
      case 'startsWith':
        return { [field]: { startsWith: value, mode: 'insensitive' } };
      case 'greaterThan':
        return { [field]: { gt: value } };
      case 'lessThan':
        return { [field]: { lt: value } };
      case 'inRange':
        const [min, max] = value as [number, number];
        return { [field]: { gte: min, lte: max } };
      case 'inLast':
        const date = new Date();
        date.setDate(date.getDate() - (value as number));
        return { [field]: { gte: date } };
      default:
        return {};
    }
  }

  async getSmartPlaylistSongs(
    playlistId: string
  ): Promise<Media[]> {
    const playlist = await prisma.smartPlaylist.findUnique({
      where: { id: playlistId }
    });

    const where = this.evaluateRules(playlist.rules as RuleGroup);

    let query = prisma.media.findMany({
      where,
      orderBy: this.getSortOrder(playlist.sortBy, playlist.sortDirection)
    });

    if (playlist.limit) {
      if (playlist.limit.type === 'songs') {
        query = query.take(playlist.limit.value);
      }
      // Duration limit requires post-processing
    }

    return query;
  }
}
```

### Database Changes
```prisma
model SmartPlaylist {
  id            String   @id @default(cuid())
  name          String
  rules         Json     // RuleGroup JSON
  limitType     String?  // 'songs' | 'duration'
  limitValue    Int?
  sortBy        String   @default("dateAdded")
  sortDirection String   @default("desc")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Dependencies
- **Requires:** Core playlist functionality
- **Blocks:** None

## Built-in Smart Playlists

| Name | Rules |
|------|-------|
| Recently Added | dateAdded in last 30 days, sort by dateAdded desc, limit 50 |
| Most Played | playCount > 10, sort by playCount desc, limit 100 |
| Never Played | playCount = 0 |
| Long Songs | duration > 6 minutes |
| Short Songs | duration < 3 minutes |
| This Year | year = current year |

## UI Design

### Rule Builder Interface
```
┌─────────────────────────────────────────────────────┐
│ Smart Playlist: "80s Rock"                          │
├─────────────────────────────────────────────────────┤
│ Match [ALL v] of the following rules:              │
│                                                     │
│ [Genre    v] [contains v] [rock        ] [×]       │
│ [Year     v] [in range v] [1980] to [1989] [×]     │
│ [+ Add Rule]                                        │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ Limit to: [50 songs v]                             │
│ Sort by:  [Play Count v] [Descending v]           │
│                                                     │
│ Preview: 47 songs match                            │
│ ─────────────────────────────────────────────────── │
│ [Cancel]                              [Save]        │
└─────────────────────────────────────────────────────┘
```

## Notes
- Consider caching smart playlist results for performance
- May want to add "refresh" button for manual update
- Could add notification when new songs match a smart playlist
- Consider integration with Similar Songs feature for discovery playlists
- May want to support nested rule groups for complex logic
