import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../../src/utils/errorHandler';

describe('errorHandler utils', () => {
  it('returns default message for null/undefined', () => {
    expect(getErrorMessage(null)).toBe('Unknown error occurred');
    expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
  });

  it('handles simple string errors', () => {
    expect(getErrorMessage('Simple error string')).toBe('Simple error string');
  });

  it('handles stringified JSON errors', () => {
    const errorString = JSON.stringify({ error: { message: 'Nested JSON error' } });
    expect(getErrorMessage(errorString)).toBe('Nested JSON error');

    const errorString2 = JSON.stringify({ message: 'JSON error' });
    expect(getErrorMessage(errorString2)).toBe('JSON error');
  });

  it('handles standard Error objects', () => {
    const error = new Error('Standard error message');
    expect(getErrorMessage(error)).toBe('Standard error message');
  });

  it('handles error objects containing embedded JSON strings in message', () => {
    const error = new Error('Error [429]: {"error": {"message": "Rate limited"}}');
    expect(getErrorMessage(error)).toContain('API Quota Exceeded');
    expect(getErrorMessage(error)).toContain('Rate limited');
  });

  it('handles nested error.message objects', () => {
    const error = { message: { message: 'Deep error message' } };
    expect(getErrorMessage(error)).toBe('Deep error message');
    
    const error2 = { message: { someKey: 'someValue' } };
    expect(getErrorMessage(error2)).toBe('{"someKey":"someValue"}');
  });

  it('handles nested error.error objects/strings', () => {
    const error1 = { error: 'String error property' };
    expect(getErrorMessage(error1)).toBe('String error property');

    const error2 = { error: { message: 'Object error property' } };
    expect(getErrorMessage(error2)).toBe('Object error property');
  });

  it('falls back to JSON stringify or String representation', () => {
    const error = { code: 500, detail: 'Failed' };
    expect(getErrorMessage(error)).toContain('Gemini API is currently experiencing issues');
    expect(getErrorMessage(error)).toContain('{"code":500,"detail":"Failed"}');
    
    // Circular reference to trigger catch block on JSON.stringify
    const circularObj: any = {};
    circularObj.self = circularObj;
    expect(getErrorMessage(circularObj)).toBe('[object Object]');
  });

  it('appends friendly notes for known API errors', () => {
    expect(getErrorMessage('quota exceeded')).toContain('API Quota Exceeded. Please check your Gemini API plan');
    expect(getErrorMessage('429')).toContain('API Quota Exceeded. Please check your Gemini API plan');
    expect(getErrorMessage('RESOURCE_EXHAUSTED')).toContain('API Quota Exceeded. Please check your Gemini API plan');
    
    expect(getErrorMessage('503 Service Unavailable')).toContain('Gemini API is currently experiencing issues');
    expect(getErrorMessage('500 Internal Server Error')).toContain('Gemini API is currently experiencing issues');
    expect(getErrorMessage('The server is overloaded')).toContain('Gemini API is currently experiencing issues');
  });
});
