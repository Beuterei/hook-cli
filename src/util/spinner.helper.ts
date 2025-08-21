import { color } from 'console-log-colors';

export class Spinner {
    private currentFrame: number = 0;

    private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    private intervalId?: NodeJS.Timeout;

    private message?: string;

    private speed: number = 100;

    public done(doneMessage?: string): void {
        this.stop(doneMessage);
    }

    public doneWithWarning(doneMessage?: string): void {
        this.stop(doneMessage, 'warning');
    }

    public fail(message: string): void {
        this.stop(message, 'fail');
    }

    public failWithNoFail(warnOnly: boolean, message: string): void {
        if (warnOnly) {
            this.doneWithWarning(message);
        } else {
            this.fail(message);
        }
    }

    public setMessage(message: string): void {
        this.message = message;
    }

    public start(message: string): void {
        if (this.intervalId) {
            return;
        }

        this.message = message;

        process.stdout.write('\u001B[?25l'); // Hide cursor

        this.intervalId = setInterval(() => {
            process.stdout.write(`\r${color.cyan(this.frames[this.currentFrame])} ${this.message}`);
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }, this.speed);
    }

    private stop(message?: string, status: 'fail' | 'success' | 'warning' = 'success'): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            process.stdout.write('\r\u001B[K'); // Clear line
            process.stdout.write('\u001B[?25h'); // Show cursor
            if (message) {
                if (status === 'fail') {
                    process.stdout.write(`${color.red('✗')} ${message}\n`);
                    return;
                }

                if (status === 'warning') {
                    process.stdout.write(`${color.yellow('⚠')} ${message}\n`);
                    return;
                }

                process.stdout.write(`${color.green('✓')} ${message}\n`);
            }
        }
    }
}
