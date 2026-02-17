import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('🌱 Starting database seed...');

  // Clear existing data
  await prisma.playHistory.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.download.deleteMany();
  await prisma.media.deleteMany();

  console.info('🗑️  Cleared existing data');

  // Create sample media
  const media1 = await prisma.media.create({
    data: {
      title: 'Sample Track 1',
      artist: 'Demo Artist',
      album: 'Demo Album',
      duration: 210,
      filePath: 'sample/track1.mp3',
      mimeType: 'audio/mpeg',
      fileSize: 5242880,
      isLiked: true,
      playCount: 15,
    },
  });

  const media2 = await prisma.media.create({
    data: {
      title: 'Another Song',
      artist: 'Test Band',
      album: 'Test Album',
      duration: 185,
      filePath: 'sample/track2.mp3',
      mimeType: 'audio/mpeg',
      fileSize: 4521984,
      isLiked: false,
      playCount: 8,
    },
  });

  const media3 = await prisma.media.create({
    data: {
      title: 'Electronic Beat',
      artist: 'DJ Sample',
      album: 'Electronic Vibes',
      duration: 245,
      filePath: 'sample/track3.mp3',
      mimeType: 'audio/mpeg',
      fileSize: 6144000,
      isLiked: true,
      playCount: 22,
    },
  });

  const media4 = await prisma.media.create({
    data: {
      title: 'Acoustic Morning',
      artist: 'Folk Singer',
      album: 'Morning Sessions',
      duration: 195,
      filePath: 'sample/track4.mp3',
      mimeType: 'audio/mpeg',
      fileSize: 4800000,
      isLiked: false,
      playCount: 5,
    },
  });

  const media5 = await prisma.media.create({
    data: {
      title: 'Jazz Evening',
      artist: 'Jazz Quartet',
      album: 'Night Jazz',
      duration: 320,
      filePath: 'sample/track5.mp3',
      mimeType: 'audio/mpeg',
      fileSize: 7680000,
      isLiked: true,
      playCount: 12,
    },
  });

  console.info(`✅ Created ${5} sample media items`);

  // Create playlists
  const playlist1 = await prisma.playlist.create({
    data: {
      name: 'My Favorites',
      description: 'A collection of my favorite tracks',
      isSystem: false,
    },
  });

  const playlist2 = await prisma.playlist.create({
    data: {
      name: 'Workout Mix',
      description: 'High energy tracks for workouts',
      isSystem: false,
    },
  });

  const playlist3 = await prisma.playlist.create({
    data: {
      name: 'Chill Vibes',
      description: 'Relaxing music for unwinding',
      isSystem: false,
    },
  });

  console.info(`✅ Created ${3} playlists`);

  // Add items to playlists
  await prisma.playlistItem.createMany({
    data: [
      { playlistId: playlist1.id, mediaId: media1.id, position: 0 },
      { playlistId: playlist1.id, mediaId: media3.id, position: 1 },
      { playlistId: playlist1.id, mediaId: media5.id, position: 2 },
      { playlistId: playlist2.id, mediaId: media3.id, position: 0 },
      { playlistId: playlist2.id, mediaId: media2.id, position: 1 },
      { playlistId: playlist3.id, mediaId: media4.id, position: 0 },
      { playlistId: playlist3.id, mediaId: media5.id, position: 1 },
    ],
  });

  console.info('✅ Added items to playlists');

  // Create play history
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.playHistory.createMany({
    data: [
      { mediaId: media1.id, playedAt: yesterday, duration: 210 },
      { mediaId: media2.id, playedAt: yesterday, duration: 120 },
      { mediaId: media3.id, playedAt: twoHoursAgo, duration: 245 },
      { mediaId: media1.id, playedAt: oneHourAgo, duration: 200 },
      { mediaId: media5.id, playedAt: now, duration: 180 },
    ],
  });

  console.info('✅ Created play history entries');

  // Create sample queue
  await prisma.queueItem.createMany({
    data: [
      { mediaId: media1.id, position: 0 },
      { mediaId: media3.id, position: 1 },
      { mediaId: media2.id, position: 2 },
    ],
  });

  console.info('✅ Created sample queue');

  // Create sample download record
  await prisma.download.create({
    data: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Sample YouTube Video',
      status: 'COMPLETED',
      progress: 100,
      mediaId: media1.id,
    },
  });

  console.info('✅ Created sample download record');

  console.info('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
