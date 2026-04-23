const ComparisonService = require('../src/services/comparisonService');
const { validateComparisonInput, SUPPORTED_MODELS } = require('../src/utils/comparisonValidators');

describe('ComparisonValidators', () => {
    describe('validateComparisonInput', () => {
        it('should accept valid prompt and 2+ supported models', () => {
            const result = validateComparisonInput(
                'Explain photosynthesis simply',
                ['gpt-4', 'claude-v1']
            );
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should reject prompt shorter than 5 characters', () => {
            const result = validateComparisonInput(
                'hi',
                ['gpt-4', 'claude-v1']
            );
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('5 characters'))).toBe(true);
        });

        it('should reject empty models array', () => {
            const result = validateComparisonInput(
                'Valid prompt here',
                []
            );
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('2 models'))).toBe(true);
        });

        it('should reject single model', () => {
            const result = validateComparisonInput(
                'Valid prompt here',
                ['gpt-4']
            );
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('2 models'))).toBe(true);
        });

        it('should reject duplicate models', () => {
            const result = validateComparisonInput(
                'Valid prompt here',
                ['gpt-4', 'gpt-4']
            );
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
        });

        it('should reject unsupported models', () => {
            const result = validateComparisonInput(
                'Valid prompt here',
                ['gpt-4', 'invalid-model']
            );
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('Unsupported'))).toBe(true);
        });

        it('should accept all valid supported models', () => {
            const result = validateComparisonInput(
                'Valid prompt here',
                SUPPORTED_MODELS.slice(0, 2)
            );
            expect(result.isValid).toBe(true);
        });

        it('should reject null prompt', () => {
            const result = validateComparisonInput(
                null,
                ['gpt-4', 'claude-v1']
            );
            expect(result.isValid).toBe(false);
        });

        it('should reject non-array models', () => {
            const result = validateComparisonInput(
                'Valid prompt here',
                'gpt-4'
            );
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('array'))).toBe(true);
        });
    });
});

describe('ComparisonService', () => {
    // Note: These tests assume Supabase mocks or integration with a test database
    // In a real scenario, you would mock the supabase client

    describe('normalizeForDashboard', () => {
        it('returns normalized payload for dashboard rendering', () => {
            const comparison = {
                comparisonId: 'cmp_123',
                prompt: 'Test prompt',
                status: 'completed',
                createdAt: new Date().toISOString(),
                results: [
                    {
                        model: 'gpt-4',
                        status: 'completed',
                        response: 'Response text',
                        executionTimeMs: 100,
                        errorMessage: null
                    },
                    {
                        model: 'claude-v1',
                        status: 'failed',
                        response: null,
                        executionTimeMs: null,
                        errorMessage: 'Model unavailable'
                    }
                ]
            };

            const normalized = ComparisonService.normalizeForDashboard(comparison);

            expect(normalized.comparisonId).toBe('cmp_123');
            expect(normalized.prompt).toBe('Test prompt');
            expect(normalized.results.length).toBe(2);
            expect(normalized.results[0].model).toBe('gpt-4');
            expect(normalized.results[0].status).toBe('completed');
            expect(normalized.results[1].status).toBe('failed');
        });

        it('handles partial failure scenarios', () => {
            const comparison = {
                comparisonId: 'cmp_456',
                prompt: 'Multi-model test',
                status: 'completed',
                createdAt: new Date().toISOString(),
                results: [
                    {
                        model: 'gpt-4',
                        status: 'completed',
                        response: 'Success',
                        executionTimeMs: 500,
                        errorMessage: null
                    },
                    {
                        model: 'local-small',
                        status: 'failed',
                        response: null,
                        executionTimeMs: 0,
                        errorMessage: 'Local model unavailable'
                    },
                    {
                        model: 'claude-v1',
                        status: 'completed',
                        response: 'Another success',
                        executionTimeMs: 800,
                        errorMessage: null
                    }
                ]
            };

            const normalized = ComparisonService.normalizeForDashboard(comparison);

            const completed = normalized.results.filter(r => r.status === 'completed');
            const failed = normalized.results.filter(r => r.status === 'failed');

            expect(completed.length).toBe(2);
            expect(failed.length).toBe(1);
        });
    });
});
