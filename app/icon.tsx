import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/ui/IconMark';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<IconMark size={size.width} />, { ...size });
}
