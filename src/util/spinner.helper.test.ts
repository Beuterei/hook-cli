import { Spinner } from './spinner.helper';
import { color } from 'console-log-colors';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type Mock,
    type MockInstance,
    vi,
} from 'vitest';

// Mock console-log-colors
vi.mock('console-log-colors');

const colorMock = color as unknown as {
    cyan: Mock;
    green: Mock;
    red: Mock;
    yellow: Mock;
};

describe('Spinner', () => {
    let spinner: Spinner;
    let stdoutWriteSpy: MockInstance;

    beforeEach(() => {
        spinner = new Spinner();

        // Mock process.stdout.write
        stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

        // Mock color functions
        colorMock.cyan = vi.fn((text) => `cyan(${text})`);
        colorMock.green = vi.fn((text) => `green(${text})`);
        colorMock.red = vi.fn((text) => `red(${text})`);
        colorMock.yellow = vi.fn((text) => `yellow(${text})`);

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('start', () => {
        it('should start the spinner with a message', () => {
            spinner.start('Loading...');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25l'); // Hide cursor

            // Advance timers to trigger the interval
            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Loading...');
        });

        it('should not start if already running', () => {
            spinner.start('First message');
            stdoutWriteSpy.mockClear();

            spinner.start('Second message');

            // Should not start again - no new hide cursor call
            expect(stdoutWriteSpy).not.toHaveBeenCalledWith('\u001B[?25l');
        });

        it('should display frames and message correctly', () => {
            spinner.start('Processing...');

            // Advance through multiple intervals
            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Processing...');

            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠙) Processing...');

            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠹) Processing...');
        });

        it('should cycle through all frames', () => {
            spinner.start('Testing frames...');

            const expectedFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

            for (const expectedFrame of expectedFrames) {
                vi.advanceTimersByTime(100);
                expect(stdoutWriteSpy).toHaveBeenCalledWith(
                    `\rcyan(${expectedFrame}) Testing frames...`,
                );
            }

            // Should cycle back to the first frame
            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Testing frames...');
        });
    });

    describe('setMessage', () => {
        it('should update the message', () => {
            spinner.start('Initial message');
            spinner.setMessage('Updated message');

            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Updated message');
        });
    });

    describe('done', () => {
        it('should stop the spinner and show success message', () => {
            spinner.start('Loading...');

            spinner.done('Completed successfully');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\r\u001B[K'); // Clear line
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25h'); // Show cursor
            expect(stdoutWriteSpy).toHaveBeenCalledWith('green(✓) Completed successfully\n');
        });

        it('should stop without message', () => {
            spinner.start('Loading...');

            spinner.done();

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\r\u001B[K');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25h');
            expect(stdoutWriteSpy).not.toHaveBeenCalledWith(expect.stringContaining('✓'));
        });

        it('should do nothing if not running', () => {
            const callCount = stdoutWriteSpy.mock.calls.length;

            spinner.done('Message');

            expect(stdoutWriteSpy).toHaveBeenCalledTimes(callCount);
        });

        it('should stop the interval when called', () => {
            spinner.start('Loading...');

            // Advance to make sure interval is working
            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Loading...');

            spinner.done('Completed');

            // Clear mock to test that interval has stopped
            stdoutWriteSpy.mockClear();

            // Advance time - should not trigger any more spinner output
            vi.advanceTimersByTime(200);

            // Should not have any spinner output calls
            expect(stdoutWriteSpy).not.toHaveBeenCalledWith(expect.stringContaining('cyan('));
        });
    });

    describe('doneWithWarning', () => {
        it('should stop the spinner and show warning message', () => {
            spinner.start('Processing...');

            spinner.doneWithWarning('Completed with warnings');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\r\u001B[K');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25h');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('yellow(⚠) Completed with warnings\n');
        });

        it('should stop without message', () => {
            spinner.start('Processing...');

            spinner.doneWithWarning();

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\r\u001B[K');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25h');
            expect(stdoutWriteSpy).not.toHaveBeenCalledWith(expect.stringContaining('⚠'));
        });
    });

    describe('fail', () => {
        it('should stop the spinner and show error message', () => {
            spinner.start('Processing...');

            spinner.fail('Process failed');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\r\u001B[K');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25h');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('red(✗) Process failed\n');
        });
    });

    describe('failWithNoFail', () => {
        it('should call doneWithWarning when warnOnly is true', () => {
            const doneWithWarningSpy = vi.spyOn(spinner, 'doneWithWarning');

            spinner.failWithNoFail(true, 'Warning message');

            expect(doneWithWarningSpy).toHaveBeenCalledWith('Warning message');
        });

        it('should call fail when warnOnly is false', () => {
            const failSpy = vi.spyOn(spinner, 'fail');

            spinner.failWithNoFail(false, 'Error message');

            expect(failSpy).toHaveBeenCalledWith('Error message');
        });
    });

    describe('edge cases', () => {
        it('should handle multiple stop calls gracefully', () => {
            spinner.start('Loading...');

            spinner.done('First stop');
            const firstStopCalls = stdoutWriteSpy.mock.calls.length;

            spinner.done('Second stop');

            // Should not have made additional calls
            expect(stdoutWriteSpy).toHaveBeenCalledTimes(firstStopCalls);
        });

        it('should handle stop without start', () => {
            expect(() => spinner.done('Message')).not.toThrow();
            expect(() => spinner.fail('Message')).not.toThrow();
            expect(() => spinner.doneWithWarning('Message')).not.toThrow();
        });

        it('should properly reset after stopping and starting again', () => {
            // First cycle
            spinner.start('First message');
            spinner.done('First done');

            stdoutWriteSpy.mockClear();

            // Second cycle
            spinner.start('Second message');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25l'); // Should hide cursor again

            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Second message');

            spinner.fail('Second fail');
            expect(stdoutWriteSpy).toHaveBeenCalledWith('red(✗) Second fail\n');
        });

        it('should handle frame cycling correctly over many iterations', () => {
            spinner.start('Long running...');

            // Run through multiple complete cycles (30 frames = 3 complete cycles)
            for (let index = 0; index < 30; index++) {
                vi.advanceTimersByTime(100);
            }

            // Should still be working correctly - should be back to first frame
            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Long running...');
        });

        it('should handle message updates while running', () => {
            spinner.start('Initial message');

            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠋) Initial message');

            spinner.setMessage('Updated message');

            vi.advanceTimersByTime(100);
            expect(stdoutWriteSpy).toHaveBeenCalledWith('\rcyan(⠙) Updated message');
        });

        it('should verify cursor management', () => {
            spinner.start('Testing cursor...');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25l'); // Hide cursor

            spinner.done('Finished');

            expect(stdoutWriteSpy).toHaveBeenCalledWith('\u001B[?25h'); // Show cursor
        });
    });
});
