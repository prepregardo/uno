'use client';

import { useState } from 'react';

interface YouTubeLiteProps {
  videoId: string;
  title: string;
}

export default function YouTubeLite({ videoId, title }: YouTubeLiteProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isLoaded) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 0, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
    );
  }

  return (
    <button
      type="button"
      className="lite-youtube-btn"
      aria-label={`Воспроизвести видео: ${title}`}
      onClick={() => setIsLoaded(true)}
    >
      <picture>
        <source
          srcSet={`https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`}
          type="image/webp"
        />
        <img
          src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
          alt={title}
          loading="lazy"
          decoding="async"
          width={640}
          height={360}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </picture>
      <span className="lite-youtube-play" aria-hidden="true">
        <svg viewBox="0 0 68 48" width="68" height="48">
          <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
          <path d="M 45,24 27,14 27,34" fill="#fff"/>
        </svg>
      </span>
    </button>
  );
}
