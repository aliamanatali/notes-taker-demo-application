export const formatGalacticDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatted = date.toLocaleDateString('en-US', options);
  return `Galactic Standard Time: ${formatted}`;
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} parsecs ago`;
  if (diffInDays === 1) return '1 rotation ago';
  if (diffInDays < 7) return `${diffInDays} rotations ago`;
  
  return formatGalacticDate(date);
};