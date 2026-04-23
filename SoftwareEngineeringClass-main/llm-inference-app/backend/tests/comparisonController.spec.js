const ComparisonController = require('../src/controllers/comparisonController');
const ComparisonService = require('../src/services/comparisonService');

describe('ComparisonController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { userId: 'user-123' },
      body: {},
      params: {},
      query: {}
    };
    res = jasmine.createSpyObj('res', ['status', 'json']);
    res.status.and.returnValue(res);
    res.json.and.returnValue(res);
  });

  describe('submitComparison', () => {
    it('returns 201 for a valid comparison request', async () => {
      req.body = {
        prompt: 'Valid prompt here',
        models: ['gpt-4', 'claude-v1']
      };

      const completed = {
        comparisonId: 'cmp_123',
        prompt: 'Valid prompt here',
        status: 'completed',
        createdAt: new Date().toISOString(),
        results: [
          { model: 'gpt-4', status: 'completed', response: 'A', executionTimeMs: 10, errorMessage: null },
          { model: 'claude-v1', status: 'completed', response: 'B', executionTimeMs: 12, errorMessage: null }
        ]
      };

      spyOn(ComparisonService, 'createComparison').and.returnValue(
        Promise.resolve({
          comparisonId: 'cmp_123',
          prompt: 'Valid prompt here',
          models: ['gpt-4', 'claude-v1'],
          status: 'pending',
          createdAt: new Date().toISOString(),
          results: []
        })
      );
      spyOn(ComparisonService, 'runInferenceForComparison').and.returnValue(Promise.resolve());
      spyOn(ComparisonService, 'getComparison').and.returnValue(Promise.resolve(completed));
      spyOn(ComparisonService, 'normalizeForDashboard').and.returnValue(completed);

      await ComparisonController.submitComparison(req, res);

      expect(ComparisonService.runInferenceForComparison).toHaveBeenCalled();
      expect(ComparisonService.getComparison).toHaveBeenCalledWith('cmp_123', 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comparison request submitted',
        data: completed
      });
    });

    it('returns 400 when service validation rejects the payload', async () => {
      req.body = {
        prompt: 'Valid prompt here',
        models: ['gpt-4', 'gpt-4']
      };

      const err = new Error('Duplicate models are not allowed');
      err.status = 400;
      spyOn(ComparisonService, 'createComparison').and.returnValue(Promise.reject(err));

      await ComparisonController.submitComparison(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({
          success: false,
          error: { code: 'VALIDATION_ERROR' }
        })
      );
    });
  });

  describe('getComparison', () => {
    it('returns 200 with comparison data', async () => {
      req.params = { comparisonId: 'cmp_123' };

      const payload = {
        comparisonId: 'cmp_123',
        prompt: 'Test prompt',
        status: 'completed',
        createdAt: new Date().toISOString(),
        results: [
          { model: 'gpt-4', status: 'completed', response: 'Response', executionTimeMs: 100, errorMessage: null }
        ]
      };

      spyOn(ComparisonService, 'getComparison').and.returnValue(Promise.resolve(payload));
      spyOn(ComparisonService, 'normalizeForDashboard').and.returnValue(payload);

      await ComparisonController.getComparison(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comparison retrieved successfully',
        data: payload
      });
    });

    it('returns 404 when comparison not found', async () => {
      req.params = { comparisonId: 'nonexistent' };

      const err = new Error('Comparison not found');
      err.status = 404;
      spyOn(ComparisonService, 'getComparison').and.returnValue(Promise.reject(err));

      await ComparisonController.getComparison(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({
          success: false,
          message: 'Comparison not found',
          error: { code: 'COMPARISON_NOT_FOUND' }
        })
      );
    });
  });

  describe('getComparisonHistory', () => {
    it('returns comparison history with pagination', async () => {
      req.query = { limit: '10', offset: '0' };

      const mockHistory = {
        data: [
          {
            comparisonId: 'cmp_1',
            prompt: 'Test 1',
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ],
        total: 1,
        limit: 10,
        offset: 0
      };

      spyOn(ComparisonService, 'getComparisonHistory').and.returnValue(Promise.resolve(mockHistory));

      await ComparisonController.getComparisonHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comparison history retrieved successfully',
        data: mockHistory.data,
        pagination: {
          total: 1,
          limit: 10,
          offset: 0
        }
      });
    });
  });

  describe('deleteComparison', () => {
    it('returns 200 when comparison is deleted', async () => {
      req.params = { comparisonId: 'cmp_123' };

      spyOn(ComparisonService, 'deleteComparison').and.returnValue(Promise.resolve({ success: true }));

      await ComparisonController.deleteComparison(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comparison deleted successfully'
      });
    });

    it('returns 404 when comparison not found for deletion', async () => {
      req.params = { comparisonId: 'nonexistent' };

      const err = new Error('Comparison not found');
      err.status = 404;
      spyOn(ComparisonService, 'deleteComparison').and.returnValue(Promise.reject(err));

      await ComparisonController.deleteComparison(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
