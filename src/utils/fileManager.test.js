import { sanitizeFileName, ensureFileExtension, isEditableTextFile, getLinkCardInfo } from './fileManager';

describe('fileManager helpers', () => {
  it('sanitizes unsafe characters and whitespace', () => {
    expect(sanitizeFileName('  My/Note: 1  ')).toBe('My_Note_1');
  });

  it('adds a fallback extension when missing', () => {
    expect(ensureFileExtension('README')).toBe('README.txt');
  });

  it('detects editable text files', () => {
    expect(isEditableTextFile('notes.py')).toBe(true);
    expect(isEditableTextFile('image.png')).toBe(false);
  });

  it('parses link card metadata', () => {
    const info = getLinkCardInfo('project.link', 'Title: Signup\nURL: https://example.com');
    expect(info).toEqual({ title: 'Signup', url: 'https://example.com' });
  });
});
