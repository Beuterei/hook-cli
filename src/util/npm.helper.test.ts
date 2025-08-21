import { NPMOutputParser } from './npm.helper';
import { describe, expect, it } from 'vitest';

describe('NPMOutputParser', () => {
    it('parses valid npm JSON output', () => {
        const json = '{"lodash":{"current":"4.17.20","latest":"4.17.21","wanted":"4.17.21"}}';
        const result = NPMOutputParser(json);
        expect(result).toEqual({
            lodash: { current: '4.17.20', latest: '4.17.21', wanted: '4.17.21' },
        });
    });

    it('throws error on invalid JSON', () => {
        expect(() => NPMOutputParser('{invalid JSON')).toThrow('Unable to parse npm json response');
    });

    it('throws npm error message if present', () => {
        const errorJson = '{"message":"Some npm error"}';
        expect(() => NPMOutputParser(errorJson)).toThrow('Some npm error');
    });
});
