import { YarnOutputParser } from './yarn.helper';
import { describe, expect, it } from 'vitest';

describe('YarnOutputParser', () => {
    it('parses multi-line yarn JSON output', () => {
        const stdout =
            '{"type":"auditSummary","data":{"vulnerabilities":{}}}\n{"type":"table","data":{"head":["Package","Current","Wanted","Latest"],"body":[["lodash","4.17.20","4.17.21","4.17.21"]]}}';

        const result = YarnOutputParser(stdout, '');
        expect(result).toHaveLength(2);
        expect(result[1].type).toBe('table');
    });

    it('throws on invalid JSON', () => {
        expect(() => YarnOutputParser('{invalid', '')).toThrow(
            'Unable to parse yarn json response',
        );
    });

    it('throws on error element', () => {
        const stderr = '{"type":"error","data":"Some yarn error"}';
        expect(() => YarnOutputParser('', stderr)).toThrow('Some yarn error');
    });

    it('throws "Unknown error" when error.data is not a string', () => {
        const stderr = '{"type":"error","data":{}}';
        expect(() => YarnOutputParser('', stderr)).toThrow('Unknown error');
    });
});
