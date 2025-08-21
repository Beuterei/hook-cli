import { execute, ExecuteError } from './exec.helper';
import { exec } from 'child_process';
import { describe, expect, it, type Mock, vi } from 'vitest';

// Mock child_process.exec
vi.mock('child_process');

const execMock = exec as unknown as Mock;

describe('exec.helper', () => {
    describe('ExecuteError', () => {
        it('should create an ExecuteError with all properties', () => {
            const error = new ExecuteError(1, 'stdout content', 'stderr content');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ExecuteError);
            expect(error.code).toBe(1);
            expect(error.stdout).toBe('stdout content');
            expect(error.stderr).toBe('stderr content');
        });

        it('should handle null exit code', () => {
            const error = new ExecuteError(null, 'stdout', 'stderr');

            expect(error.code).toBeNull();
            expect(error.stdout).toBe('stdout');
            expect(error.stderr).toBe('stderr');
        });

        it('should handle empty stdout and stderr', () => {
            const error = new ExecuteError(1, '', '');

            expect(error.code).toBe(1);
            expect(error.stdout).toBe('');
            expect(error.stderr).toBe('');
        });
    });

    describe('execute', () => {
        it('should resolve with stdout, stderr, and exit code on successful execution', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(0);
                    }
                }),
                stderr: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Warning message\n');
                        }
                    }),
                },
                stdout: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Hello World\n');
                        }
                    }),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            const result = await execute('echo "Hello World"');

            expect(execMock).toHaveBeenCalledWith('echo "Hello World"');
            expect(result).toEqual({
                code: 0,
                stderr: 'Warning message\n',
                stdout: 'Hello World\n',
            });
        });

        it('should reject with ExecuteError on failed execution', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(1);
                    }
                }),
                stderr: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Error occurred\n');
                        }
                    }),
                },
                stdout: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Some output\n');
                        }
                    }),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            await expect(execute('false')).rejects.toThrow(ExecuteError);

            try {
                await execute('false');
            } catch (error) {
                expect(error).toBeInstanceOf(ExecuteError);
                expect((error as ExecuteError).code).toBe(1);
                expect((error as ExecuteError).stdout).toBe('Some output\n');
                expect((error as ExecuteError).stderr).toBe('Error occurred\n');
            }
        });

        it('should handle multiple stdout data chunks', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(0);
                    }
                }),
                stderr: {
                    on: vi.fn(),
                },
                stdout: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('First chunk ');
                            callback('Second chunk ');
                            callback('Third chunk\n');
                        }
                    }),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            const result = await execute('echo "Multiple chunks"');

            expect(result.stdout).toBe('First chunk Second chunk Third chunk\n');
        });

        it('should handle multiple stderr data chunks', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(0);
                    }
                }),
                stderr: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Error part 1 ');
                            callback('Error part 2\n');
                        }
                    }),
                },
                stdout: {
                    on: vi.fn(),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            const result = await execute('command-with-warnings');

            expect(result.stderr).toBe('Error part 1 Error part 2\n');
        });

        it('should handle commands with no output', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(0);
                    }
                }),
                stderr: {
                    on: vi.fn(),
                },
                stdout: {
                    on: vi.fn(),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            const result = await execute('true');

            expect(result).toEqual({
                code: 0,
                stderr: '',
                stdout: '',
            });
        });

        it('should handle null stdout and stderr streams', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(0);
                    }
                }),
                stderr: null,
                stdout: null,
            };

            execMock.mockReturnValue(mockChildProcess);

            const result = await execute('command-with-no-streams');

            expect(result).toEqual({
                code: 0,
                stderr: '',
                stdout: '',
            });
        });

        it('should handle non-zero exit codes correctly', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(127);
                    }
                }),
                stderr: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Command failed\n');
                        }
                    }),
                },
                stdout: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Command output\n');
                        }
                    }),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            await expect(execute('nonexistent-command')).rejects.toThrow(ExecuteError);

            try {
                await execute('nonexistent-command');
            } catch (error) {
                expect((error as ExecuteError).code).toBe(127);
                expect((error as ExecuteError).stdout).toBe('Command output\n');
                expect((error as ExecuteError).stderr).toBe('Command failed\n');
            }
        });

        it('should handle null exit code (process killed)', async () => {
            const mockChildProcess = {
                on: vi.fn((event, callback) => {
                    if (event === 'exit') {
                        callback(null);
                    }
                }),
                stderr: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Process killed\n');
                        }
                    }),
                },
                stdout: {
                    on: vi.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Partial output\n');
                        }
                    }),
                },
            };

            execMock.mockReturnValue(mockChildProcess);

            await expect(execute('killed-process')).rejects.toThrow(ExecuteError);

            try {
                await execute('killed-process');
            } catch (error) {
                expect((error as ExecuteError).code).toBeNull();
                expect((error as ExecuteError).stdout).toBe('Partial output\n');
                expect((error as ExecuteError).stderr).toBe('Process killed\n');
            }
        });
    });
});
