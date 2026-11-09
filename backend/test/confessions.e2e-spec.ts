import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Confessions API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/confessions (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/confessions').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('/confessions (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/confessions')
      .send({
        campusId: 'dummy-campus',
        content: 'J’ai encore mis le mauvais mot de passe pour ouvrir mon cours en ligne. Je suis fatigué·e.',
        category: 'STUDY',
        mood: 'fatigué·e',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('deletionCode');
    expect(response.body.content).toContain('mot de passe');
  });

  it('/confessions/:id/comments (POST and GET)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/confessions')
      .send({
        campusId: 'dummy-campus',
        content: 'Test de commentaire sur cette confession.',
        category: 'OMG',
        mood: 'curieux',
      })
      .expect(201);

    const confessionId = createResponse.body.id;

    const commentResponse = await request(app.getHttpServer())
      .post(`/confessions/${confessionId}/comments`)
      .send({
        content: 'Je me sens tellement identifié·e 😭',
        alias: 'Hibou curieux',
      })
      .expect(201);

    expect(commentResponse.body).toHaveProperty('id');
    expect(commentResponse.body.content).toContain('identifié');

    const listResponse = await request(app.getHttpServer())
      .get(`/confessions/${confessionId}/comments`)
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.some((comment: any) => comment.content.includes('identifié'))).toBe(true);
  });

  it('/confessions/:id/reports (POST)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/confessions')
      .send({
        campusId: 'dummy-campus',
        content: 'Signalement de contenu inapproprié pour la modération.',
        category: 'GOOD',
        mood: 'inquiet',
      })
      .expect(201);

    const confessionId = createResponse.body.id;

    const reportResponse = await request(app.getHttpServer())
      .post(`/confessions/${confessionId}/reports`)
      .send({
        motif: 'SPAM',
        detail: 'Contenu de mauvais goût.',
      })
      .expect(201);

    expect(reportResponse.body).toHaveProperty('id');
    expect(reportResponse.body.motif).toBe('SPAM');
    expect(reportResponse.body.status).toBe('OPEN');
  });

  it('/reports/:id/status (PATCH)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/confessions')
      .send({
        campusId: 'dummy-campus',
        content: 'Ce signalement va être traité par la modération.',
        category: 'STUDY',
        mood: 'préoccupé',
      })
      .expect(201);

    const confessionId = createResponse.body.id;

    const reportResponse = await request(app.getHttpServer())
      .post(`/confessions/${confessionId}/reports`)
      .send({
        motif: 'DANGER',
        detail: 'Contenu nécessitant une vérification rapide.',
      })
      .expect(201);

    const updatedResponse = await request(app.getHttpServer())
      .patch(`/reports/${reportResponse.body.id}/status`)
      .send({ status: 'REVIEWED' })
      .expect(200);

    expect(updatedResponse.body.status).toBe('REVIEWED');

    const listResponse = await request(app.getHttpServer())
      .get('/confessions/reports')
      .expect(200);

    expect(listResponse.body.some((report: any) => report.id === reportResponse.body.id && report.status === 'REVIEWED')).toBe(true);

    const filteredResponse = await request(app.getHttpServer())
      .get('/reports?status=REVIEWED')
      .expect(200);

    expect(filteredResponse.body.some((report: any) => report.id === reportResponse.body.id)).toBe(true);
  });

  it('/confessions/:id/status (PATCH)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/confessions')
      .send({
        campusId: 'dummy-campus',
        content: 'Cette confession va être masquée par la modération.',
        category: 'GOOD',
        mood: 'stressé',
      })
      .expect(201);

    const patchedResponse = await request(app.getHttpServer())
      .patch(`/confessions/${createResponse.body.id}/status`)
      .send({ status: 'MASKED' })
      .expect(200);

    expect(patchedResponse.body.status).toBe('MASKED');
    expect(patchedResponse.body.content).toBe('Cette confession a été masquée par la modération.');

    const listResponse = await request(app.getHttpServer())
      .get('/confessions')
      .expect(200);

    expect(listResponse.body.some((confession: any) => confession.id === createResponse.body.id && confession.status === 'MASKED')).toBe(false);
  });

  it('/campuses (GET and POST)', async () => {
    const slug = `grenoble-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/campuses')
      .send({
        name: 'Université Grenoble Alpes',
        slug,
        description: 'Campus des sciences et technologies',
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.name).toBe('Université Grenoble Alpes');

    const listResponse = await request(app.getHttpServer())
      .get('/campuses')
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.some((campus: any) => campus.slug === 'grenoble')).toBe(true);
  });
});
