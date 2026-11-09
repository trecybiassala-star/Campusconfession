import { PrismaClient, ConfessionCategory, ConfessionStatus, ConfessionType, ReactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.moderationLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.alias.deleteMany();
  await prisma.confession.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.forbiddenWord.deleteMany();
  await prisma.bannedDevice.deleteMany();
  await prisma.moderator.deleteMany();
  await prisma.campus.deleteMany();

  const campusA = await prisma.campus.create({
    data: {
      name: 'Université de Lyon',
      slug: 'lyon',
      description: 'Campus des sciences et des arts',
      rules: 'Respect, bienveillance et anonymat.',
      isActive: true,
    },
  });

  const campusB = await prisma.campus.create({
    data: {
      name: 'Université de Paris',
      slug: 'paris',
      description: 'Campus urbain et dynamique',
      rules: 'Aucune donnée personnelle ni propos haineux.',
      isActive: true,
    },
  });

  const campuses = [campusA, campusB];
  const categories: ConfessionCategory[] = ['FUN', 'STUDY', 'LOVE', 'OMG', 'GOOD'];
  const texts = [
    'J’ai oublié mon QR code de cours et j’ai dû demander à ma voisine de le scanner comme si je n’étais pas étudiant.',
    'J’ai laissé mon portable en mode silencieux pendant cinq heures et j’ai raté le message du prof sur l’échéance.',
    'Je croyais qu’un TP en groupe allait être simple, puis j’ai réalisé que j’étais le seul à avoir lu le sujet.',
    'J’ai voulu faire le malin devant mes amis, puis j’ai confondu le nom d’un cours avec le nom d’un prof.',
    'J’ai décidé de rester étudiant jusqu’à la fin de la séance, puis j’ai reçu un message “tu es en retard”.',
    'Je crois que l’amphi a été construit pour me faire perdre ma motivation en moins d’une heure.',
    'Mon cœur a fait un bond quand on s’est croisé en dehors du cours, puis on a continué sans se parler.',
    'J’ai encore mis trois fois le mauvais mot de passe pour ma salle de travail collaborative.',
    'Le pire, c’est qu’on a tous eu la même idée et personne n’a osé la dire à voix haute.',
    'J’ai bien cru que l’ordinateur de la bibliothèque allait me sauver, jusqu’au moment où il a redémarré.',
  ];

  for (let i = 0; i < 20; i += 1) {
    const campus = campuses[i % campuses.length];
    const confession = await prisma.confession.create({
      data: {
        campusId: campus.id,
        content: texts[i % texts.length],
        maskedContent: texts[i % texts.length],
        category: categories[i % categories.length],
        mood: i % 2 === 0 ? 'gêné·e' : 'fatigué·e',
        type: i % 3 === 0 ? ConfessionType.ADVICE : ConfessionType.NORMAL,
        status: ConfessionStatus.PUBLISHED,
        riskScore: 5,
        deviceHash: `device-${i + 1}`,
        searchVector: texts[i % texts.length],
      },
    });

    const reactions = [ReactionType.HAHA, ReactionType.WOW, ReactionType.UNDERSTAND, ReactionType.FIRE];

    for (let j = 0; j < 2; j += 1) {
      await prisma.reaction.create({
        data: {
          confessionId: confession.id,
          deviceHash: `reaction-${i}-${j}`,
          type: reactions[(i + j) % reactions.length],
        },
      });
    }

    await prisma.comment.create({
      data: {
        confessionId: confession.id,
        content: 'Et moi je me sens identifié à 100 % 😭',
        alias: 'Hibou Curieux',
        deviceHash: `comment-${i}`,
      },
    });
  }

  await prisma.forbiddenWord.createMany({
    data: [
      { campusId: campusA.id, word: 'haine', severity: 'high' },
      { campusId: campusA.id, word: 'suicide', severity: 'high' },
      { campusId: campusB.id, word: 'phone', severity: 'medium' },
      { campusId: campusB.id, word: 'adresse', severity: 'medium' },
    ],
  });

  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
