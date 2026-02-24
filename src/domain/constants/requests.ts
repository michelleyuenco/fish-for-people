import type { RequestType } from '../models/Request';

export const REQUEST_TYPE_ICONS: Record<RequestType, string> = {
  Pen: '✏️',
  'Sermon Notes': '📄',
  Water: '💧',
  Bible: '📖',
  Prayer: '🙏',
  Other: '💬',
};

export const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
  Pen: 'bg-blue-100 text-blue-800',
  'Sermon Notes': 'bg-purple-100 text-purple-800',
  Water: 'bg-cyan-100 text-cyan-800',
  Bible: 'bg-amber-100 text-amber-800',
  Prayer: 'bg-pink-100 text-pink-800',
  Other: 'bg-gray-100 text-gray-800',
};
