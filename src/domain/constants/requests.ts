import type { RequestType } from '../models/Request';

export const REQUEST_TYPE_ICONS: Record<RequestType, string> = {
  'Pen': '✏️',
  'Sermon Notes': '📄',
  'Offering Envelope': '📩',
  'Offering Envelope (Dream Now)': '💛',
  'Voiceover Device': '🎧',
  'Prayer': '🙏',
  'Other': '💬',
};

export const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
  'Pen': 'bg-blue-100 text-blue-800',
  'Sermon Notes': 'bg-purple-100 text-purple-800',
  'Offering Envelope': 'bg-orange-100 text-orange-800',
  'Offering Envelope (Dream Now)': 'bg-yellow-100 text-yellow-800',
  'Voiceover Device': 'bg-teal-100 text-teal-800',
  'Prayer': 'bg-pink-100 text-pink-800',
  'Other': 'bg-gray-100 text-gray-800',
};
