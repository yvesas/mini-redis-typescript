module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts'
    ],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 60,
            functions: 70,
            lines: 70
        }
    }
};