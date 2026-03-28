// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { appPromise } from '../../server';
import express from 'express';

// Ensure NODE_ENV is test
process.env.NODE_ENV = 'test';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Backend API Integration Tests', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.APOLLO_API_KEY = 'test-key';
    app = await appPromise;
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('POST /api/apollo/enrich', () => {
    it('should return 400 if domain is missing', async () => {
      const res = await request(app).post('/api/apollo/enrich').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Domain is required');
    });

    it('should return enriched data on successful Apollo response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          organization: { name: 'Apollo.io' }
        })
      });

      const res = await request(app)
        .post('/api/apollo/enrich')
        .send({ domain: 'apollo.io' });
        
      expect(res.status).toBe(200);
      expect(res.body.organization.name).toBe('Apollo.io');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.apollo.io/v1/organizations/enrich?domain=apollo.io',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-key'
          })
        })
      );
    });

    it('should handle Apollo errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const res = await request(app)
        .post('/api/apollo/enrich')
        .send({ domain: 'apollo.io' });
        
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/Apollo API error: 401 Unauthorized/);
    });
  });

  describe('POST /api/apollo/news', () => {
    it('should return 400 if organization_ids are missing', async () => {
      const res = await request(app).post('/api/apollo/news').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('organization_ids is required');
    });

    it('should return news data on successful Apollo response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          news_articles: [{ title: 'News 1' }]
        })
      });

      const res = await request(app)
        .post('/api/apollo/news')
        .send({ organization_ids: ['org123'] });
        
      expect(res.status).toBe(200);
      expect(res.body.news_articles[0].title).toBe('News 1');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.apollo.io/v1/news_articles/search?organization_ids%5B%5D=org123&per_page=5',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key'
          })
        })
      );
    });
  });
});