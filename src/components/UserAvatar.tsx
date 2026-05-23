type Props = {
  name: string;
  variant?: 'user' | 'stuff';
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function UserAvatar({ name, variant = 'user', size = 'md', imageUrl }: Props) {
  const label = name.trim() || '?';
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`avatar avatar--${size} avatar--img avatar--${variant}`}
      />
    );
  }
  return (
    <span
      className={`avatar avatar--${size} avatar--${variant}`}
      aria-hidden
      title={label}
    >
      {initials(label)}
    </span>
  );
}
