import { prisma } from './db.js';
import { hashPassword } from '../utils/auth.js';
import { GAME_CATALOG } from '../shared/index.js';

export async function seedDatabase() {
  console.log('Seeding Duvora database exclusively for Arpit & Shree...');

  // 1. Seed Games Catalog
  for (const game of GAME_CATALOG) {
    await prisma.game.upsert({
      where: { key: game.id },
      update: {
        title: game.title,
        description: game.description,
        category: game.category,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers
      },
      create: {
        key: game.id,
        title: game.title,
        description: game.description,
        category: game.category,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers
      }
    });
  }
  console.log(`✓ Seeded ${GAME_CATALOG.length} games into catalog`);

  // 2. Seed Couple Questions & Prompts
  const questions = [
    // Never Have I Ever
    { category: 'never_have_i_ever', subcategory: 'romantic', text: 'Never have I ever fallen in love at first sight.' },
    { category: 'never_have_i_ever', subcategory: 'romantic', text: 'Never have I ever written a love letter or poem for someone.' },
    { category: 'never_have_i_ever', subcategory: 'romantic', text: 'Never have I ever planned our future together in my head.' },
    { category: 'never_have_i_ever', subcategory: 'romantic', text: 'Never have I ever stalked your old photos just because you looked so cute.' },
    { category: 'never_have_i_ever', subcategory: 'spicy', text: 'Never have I ever kissed in an elevator or cinema.' },
    { category: 'never_have_i_ever', subcategory: 'spicy', text: 'Never have I ever had a spicy dream about you that made me blush.' },
    { category: 'never_have_i_ever', subcategory: 'funny', text: 'Never have I ever pretended to be awake just to keep talking to you.' },
    { category: 'never_have_i_ever', subcategory: 'funny', text: 'Never have I ever stolen food from your plate when you were not looking.' },

    // Truth or Dare
    { category: 'truth_or_dare', subcategory: 'truth', text: 'What was your very first thought when you saw me for the first time?' },
    { category: 'truth_or_dare', subcategory: 'truth', text: 'What is one cute habit of mine that melts your heart every time?' },
    { category: 'truth_or_dare', subcategory: 'truth', text: 'If we could book a spontaneous flight right now anywhere on earth, where would we go?' },
    { category: 'truth_or_dare', subcategory: 'truth', text: 'What is your favorite romantic memory of us so far?' },
    { category: 'truth_or_dare', subcategory: 'dare', text: 'Give me a relaxing 30-second shoulder massage right now.' },
    { category: 'truth_or_dare', subcategory: 'dare', text: 'Whisper the sweetest compliment into my ear.' },
    { category: 'truth_or_dare', subcategory: 'dare', text: 'Look into my eyes for 45 seconds without laughing or speaking.' },

    // Would You Rather
    { category: 'would_you_rather', subcategory: 'romantic', text: 'Would you rather have a cozy candlelit dinner at home or a rooftop date under the stars?', optionA: 'Cozy candlelit dinner at home', optionB: 'Rooftop date under stars' },
    { category: 'would_you_rather', subcategory: 'romantic', text: 'Would you rather always wake up together at sunrise or stay up talking until 4 AM?', optionA: 'Sunrise morning cuddles', optionB: 'Deep 4 AM midnight talks' },
    { category: 'would_you_rather', subcategory: 'spicy', text: 'Would you rather have 1 hour of intense eye contact or an unexpected surprise kiss in the rain?', optionA: '1 hour eye contact', optionB: 'Surprise kiss in the rain' },
    { category: 'would_you_rather', subcategory: 'funny', text: 'Would you rather wear matching couple outfits in public or sing a karaoke duet together?', optionA: 'Matching couple outfits', optionB: 'Karaoke duet on stage' },

    // Who Knows Who Better
    { category: 'who_knows_who_better', subcategory: 'lifestyle', text: 'What is my ultimate comfort food on a rainy day?' },
    { category: 'who_knows_who_better', subcategory: 'lifestyle', text: 'What is my dream travel bucket-list destination?' },
    { category: 'who_knows_who_better', subcategory: 'lifestyle', text: 'Am I a morning bird or a midnight owl?' },

    // Love Quiz
    { category: 'love_quiz', subcategory: 'love_languages', text: 'Which gesture makes you feel most adored and cherished?', optionA: 'Words of affirmation & sweet texts', optionB: 'Warm physical touch & long hugs' },
    { category: 'love_quiz', subcategory: 'love_languages', text: 'When planning our ideal weekend together, what sounds best?', optionA: 'Adventurous road trip to somewhere new', optionB: 'Lazy Sunday in bed with movies & takeout' }
  ];

  await prisma.question.deleteMany({});
  for (const q of questions) {
    await prisma.question.create({
      data: {
        category: q.category,
        subcategory: q.subcategory,
        text: q.text,
        optionA: (q as any).optionA || null,
        optionB: (q as any).optionB || null
      }
    });
  }
  console.log(`✓ Seeded ${questions.length} questions`);

  // 3. Clear all old sessions, rooms, notifications and users
  await prisma.session.deleteMany({});
  await prisma.roomInvitation.deleteMany({});
  await prisma.roomMember.deleteMany({});
  await prisma.coupleRoom.deleteMany({});
  await prisma.gameMove.deleteMany({});
  await prisma.gameParticipant.deleteMany({});
  await prisma.gameSession.deleteMany({});
  await prisma.gameHistory.deleteMany({});
  await prisma.userStatistics.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  // 4. Create ONLY Arpit and Shree with password "Love2927"
  const passwordHash = await hashPassword('Love2927');

  const arpit = await prisma.user.create({
    data: {
      email: 'arpit@duvora.com',
      username: 'arpit',
      name: 'Arpit',
      passwordHash,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Arpit',
      bio: 'Love hard. Play harder. Only for Shree 💕',
      soundEnabled: true,
      themePreference: 'romantic'
    }
  });

  const shree = await prisma.user.create({
    data: {
      email: 'shree@duvora.com',
      username: 'shree',
      name: 'Shree',
      passwordHash,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Shree',
      bio: 'Love hard. Play harder. Only for Arpit 👑',
      soundEnabled: true,
      themePreference: 'romantic'
    }
  });

  // Link Arpit and Shree as partners
  await prisma.user.update({
    where: { id: arpit.id },
    data: { partnerId: shree.id }
  });
  await prisma.user.update({
    where: { id: shree.id },
    data: { partnerId: arpit.id }
  });

  // Seed clean initial UserStatistics (0 games played, fresh start)
  await prisma.userStatistics.create({
    data: {
      userId: arpit.id,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
      currentStreak: 0,
      bestStreak: 0,
      winRate: 0.0,
      favoriteGame: null
    }
  });

  await prisma.userStatistics.create({
    data: {
      userId: shree.id,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
      currentStreak: 0,
      bestStreak: 0,
      winRate: 0.0,
      favoriteGame: null
    }
  });

  // Initial welcome achievement
  await prisma.userAchievement.create({
    data: { userId: arpit.id, key: 'duvora_welcome', title: 'Soulmates', icon: 'Heart' }
  });
  await prisma.userAchievement.create({
    data: { userId: shree.id, key: 'duvora_welcome', title: 'Soulmates', icon: 'Heart' }
  });

  console.log('✓ Successfully created exclusive accounts: Arpit@duvora.com & Shree@duvora.com (Password: Love2927)');
  console.log('Duvora database seeded successfully! 💖');
}

// If executed directly via CLI
const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
