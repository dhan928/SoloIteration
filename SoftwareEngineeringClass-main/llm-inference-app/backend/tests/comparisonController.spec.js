const ComparisonController = require('../src/controllers/comparisonController');
const ComparisonService = require('../src/services/comparisonService');
const { validationResult } = require('express-validator');

// Mock the ComparisonService
jest.mock('../src/services/comparisonService');

describe('ComparisonController', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'user-123' },
            body: {},
            params: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('submitComparison', () => {
        it('returns 201 for a valid comparison request', async () => {
            mockReq.body = {
                prompt: 'Valid prompt here',
                models: ['gpt-4', 'claude-v1']
            };

            const mockComparison = {
                comparisonId: 'cmp_123',
                prompt: 'Valid prompt here',
                models: ['gpt-4', 'claude-v1'],
                status: 'pending',
                createdAt: new Date().toISOString(),
                results: [
                    { model: 'gpt-4', status: 'pending', response: null, executionTimeMs: null, errorMessage: null },
                    { model: 'claude-v1', status: 'pending', response: null, executionTimeMs: null, errorMessage: null }
                ]
            };

            ComparisonService.createComparison.mockResolvedValue(mockComparison);
            ComparisonService.normalizeForDashboard.mockReturnValue(mockComparison);

            // Mock validationResult to return no errors
            jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue({
                isEmpty: () => true,
                array: () => []
            });

            await ComparisonController.submitComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Comparison request submitted',
                data: mockComparison
            });
        });

        it('returns 400 when prompt is too short', async () => {
            mockReq.body = {
                prompt: 'hi',
                models: ['gpt-4', 'claude-v1']
            };

            const error = new Error('Prompt must be at least 5 characters');
            error.status = 400;
            ComparisonService.createComparison.mockRejectedValue(error);

            jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue({
                isEmpty: () => true,
                array: () => []
            });

            await ComparisonController.submitComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: { code: 'VALIDATION_ERROR' }
                })
            );
        });

        it('returns 400 when no models are selected', async () => {
            mockReq.body = {
                prompt: 'Valid prompt here',
                models: []
            };

            const error = new Error('At least 2 models must be selected');
            error.status = 400;
            ComparisonService.createComparison.mockRejectedValue(error);

            jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue({
                isEmpty: () => true,
                array: () => []
            });

            await ComparisonController.submitComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getComparison', () => {
        it('returns 200 with comparison data', async () => {
            mockReq.params = { comparisonId: 'cmp_123' };

            const mockComparison = {
                comparisonId: 'cmp_123',
                prompt: 'Test prompt',
                status: 'completed',
                createdAt: new Date().toISOString(),
                results: [
                    { model: 'gpt-4', status: 'completed', response: 'Response', executionTimeMs: 100, errorMessage: null }
                ]
            };

            ComparisonService.getComparison.mockResolvedValue(mockComparison);
            ComparisonService.normalizeForDashboard.mockReturnValue(mockComparison);

            await ComparisonController.getComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Comparison retrieved successfully',
                data: mockComparison
            });
        });

        it('returns 404 when comparison not found', async () => {
            mockReq.params = { comparisonId: 'nonexistent' };

            ComparisonService.getComparison.mockRejectedValue(new Error('Comparison not found'));

            await ComparisonController.getComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Comparison not found',
                    error: { code: 'COMPARISON_NOT_FOUND' }
                })
            );
        });
    });

    describe('getComparisonHistory', () => {
        it('returns comparison history with pagination', async () => {
            mockReq.query = { limit: '10', offset: '0' };

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

            ComparisonService.getComparisonHistory.mockResolvedValue(mockHistory);

            await ComparisonController.getComparisonHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
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
            mockReq.params = { comparisonId: 'cmp_123' };

            ComparisonService.deleteComparison.mockResolvedValue({ success: true });

            await ComparisonController.deleteComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Comparison deleted successfully'
            });
        });

        it('returns 404 when comparison not found for deletion', async () => {
            mockReq.params = { comparisonId: 'nonexistent' };

            ComparisonService.deleteComparison.mockRejectedValue(new Error('Comparison not found'));

            await ComparisonController.deleteComparison(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});
