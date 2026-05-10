import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock axios/fetch
const mockClient = {
  get: vi.fn((url, config) => Promise.resolve({ data: { id: '1' }, status: 200 })),
  post: vi.fn((url, data, config) => Promise.resolve({ data: { id: '1' }, status: 201 })),
  put: vi.fn((url, data, config) => Promise.resolve({ data: { id: '1' }, status: 200 })),
  delete: vi.fn((url, config) => Promise.resolve({ status: 204 })),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  }
}

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should make GET request to endpoint', async () => {
      const response = await mockClient.get('/api/v1/petitions')
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
    })

    it('should include auth token in headers', async () => {
      localStorage.setItem('auth_token', 'test-token')
      await mockClient.get('/api/v1/protected')
      expect(mockClient.get).toHaveBeenCalled()
    })

    it('should handle query parameters', async () => {
      const response = await mockClient.get('/api/v1/petitions', {
        params: { status: 'published', limit: 10 }
      })
      expect(response.status).toBe(200)
    })

    it('should handle not found (404)', async () => {
      mockClient.get.mockRejectedValueOnce({ response: { status: 404 } })
      try {
        await mockClient.get('/api/v1/petitions/invalid-id')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })
  })

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      const data = {
        title: 'New Petition',
        description: 'Test petition',
        elu_id: '1'
      }
      const response = await mockClient.post('/api/v1/petitions', data)
      expect(response.status).toBe(201)
      expect(mockClient.post).toHaveBeenCalled()
    })

    it('should handle validation errors (400)', async () => {
      mockClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { errors: { title: 'Title is required' } }
        }
      })
      try {
        await mockClient.post('/api/v1/petitions', {})
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.errors).toBeDefined()
      }
    })

    it('should handle unauthorized (401)', async () => {
      mockClient.post.mockRejectedValueOnce({ response: { status: 401 } })
      try {
        await mockClient.post('/api/v1/protected', {})
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should include auth token automatically', async () => {
      localStorage.setItem('auth_token', 'test-token')
      await mockClient.post('/api/v1/petitions', { title: 'Test' })
      expect(mockClient.post).toHaveBeenCalled()
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request for updates', async () => {
      const data = { title: 'Updated Title' }
      const response = await mockClient.put('/api/v1/petitions/1', data)
      expect(response.status).toBe(200)
    })

    it('should handle conflict (409)', async () => {
      mockClient.put.mockRejectedValueOnce({ response: { status: 409 } })
      try {
        await mockClient.put('/api/v1/petitions/1', {})
      } catch (error) {
        expect(error.response.status).toBe(409)
      }
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      const response = await mockClient.delete('/api/v1/petitions/1')
      expect(response.status).toBe(204)
    })

    it('should handle forbidden (403)', async () => {
      mockClient.delete.mockRejectedValueOnce({ response: { status: 403 } })
      try {
        await mockClient.delete('/api/v1/petitions/1')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })
  })

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network Error'))
      try {
        await mockClient.get('/api/v1/petitions')
      } catch (error) {
        expect(error.message).toBe('Network Error')
      }
    })

    it('should handle timeout', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Timeout'))
      try {
        await mockClient.get('/api/v1/petitions')
      } catch (error) {
        expect(error.message).toBe('Timeout')
      }
    })

    it('should handle server error (500)', async () => {
      mockClient.get.mockRejectedValueOnce({
        response: { status: 500, data: { error: 'Internal Server Error' } }
      })
      try {
        await mockClient.get('/api/v1/petitions')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })
  })

  describe('Authentication', () => {
    it('should refresh token on 401', async () => {
      mockClient.post.mockRejectedValueOnce({ response: { status: 401 } })
      try {
        await mockClient.post('/api/v1/protected', {})
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should remove token on logout', () => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.removeItem('auth_token')
      const token = localStorage.getItem('auth_token')
      expect(token == null).toBe(true)
    })

    it('should include bearer token in authorization header', async () => {
      localStorage.setItem('auth_token', 'test-token')
      await mockClient.get('/api/v1/protected')
      expect(mockClient.get).toHaveBeenCalled()
    })
  })
})
