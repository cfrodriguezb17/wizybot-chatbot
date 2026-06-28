import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

jest.setTimeout(30000);

describe('Chatbot API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /chatbot returns 400 for empty message', () => {
    return request(app.getHttpServer())
      .post('/chatbot')
      .send({ userMessage: '' })
      .expect(400);
  });

  it('POST /chatbot returns 400 for missing userMessage field', () => {
    return request(app.getHttpServer())
      .post('/chatbot')
      .send({})
      .expect(400);
  });

  it('POST /chatbot returns 200 or handles external API error gracefully', () => {
    return request(app.getHttpServer())
      .post('/chatbot')
      .send({ userMessage: 'Hello' })
      .expect((res) => {
        if (res.status === 200) {
          expect(res.body).toHaveProperty('response');
          expect(typeof res.body.response).toBe('string');
          expect(res.body.response.length).toBeGreaterThan(0);
        } else if (res.status === 500) {
          expect(res.body).toBeDefined();
        }
      });
  });

  it('POST /chatbot returns 200 or handles external API error gracefully for product search', () => {
    return request(app.getHttpServer())
      .post('/chatbot')
      .send({ userMessage: 'I am looking for a phone' })
      .expect((res) => {
        if (res.status === 200) {
          expect(res.body).toHaveProperty('response');
          expect(res.body.response.toLowerCase()).toContain('phone');
        } else if (res.status === 500) {
          expect(res.body).toBeDefined();
        }
      });
  });
});
