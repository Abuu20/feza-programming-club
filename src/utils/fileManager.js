export const sanitizeFileName = (name = '') => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._\-() ]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '') || 'untitled.txt';
};

export const ensureFileExtension = (name = '', fallback = 'txt') => {
  const trimmed = sanitizeFileName(name);
  const hasExtension = trimmed.includes('.') && !trimmed.endsWith('.');
  if (hasExtension) return trimmed;
  return `${trimmed}.${fallback}`;
};

export const isEditableTextFile = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return true;
  return [
    'txt','md','py','pyw','js','jsx','ts','tsx','css','html','htm','json','csv','yaml','yml','xml','toml','ini','cfg','conf','log','bat','sh','sql','php','rb','java','c','cpp','cc','hpp','h','go','rs','swift','kt','dart','scala','r','m','pl','lua','groovy','link','url'
  ].includes(ext);
};

export const getLinkCardInfo = (name = '', content = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'link' || ext === 'url') {
    const match = content.match(/(?:^|\n)url\s*[:=]\s*(https?:\/\/\S+)/i);
    const titleMatch = content.match(/(?:^|\n)title\s*[:=]\s*(.+)/i);
    if (match) {
      return { title: titleMatch?.[1]?.trim() || 'Link', url: match[1].trim() };
    }
  }

  const titleMatch = content.match(/(?:^|\n)title\s*[:=]\s*(.+)/i);
  const urlMatch = content.match(/(?:^|\n)url\s*[:=]\s*(https?:\/\/\S+)/i);
  if (titleMatch && urlMatch) {
    return { title: titleMatch[1].trim(), url: urlMatch[1].trim() };
  }

  return null;
};

export const isLinkCardFile = (name = '', content = '') => Boolean(getLinkCardInfo(name, content));
