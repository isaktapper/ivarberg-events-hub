import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface EventDescriptionProps {
  description: string;
  format?: 'markdown' | 'plain';
  className?: string;
  maxLength?: number; // Max längd innan "Visa mer" visas
}

// Klipp efter hel mening i stället för mitt i ett ord — en avhuggen rad om
// insläppstider gör mer skada än en något längre teaser.
function truncateAtSentence(text: string, max: number): string {
  const slice = text.slice(0, max);
  const lastEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('.\n'),
    slice.lastIndexOf('!\n'),
    slice.lastIndexOf('?\n')
  );
  if (lastEnd > max * 0.4) {
    return text.slice(0, lastEnd + 1);
  }
  // Ingen rimlig meningsgräns — falla tillbaka på ordgräns
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + '…';
}

export function EventDescription({
  description,
  format = 'markdown',
  className = '',
  maxLength = 300
}: EventDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Kolla om beskrivningen är lång nog för expand/collapse
  const shouldShowReadMore = description.length > maxLength;
  const displayDescription = !isExpanded && shouldShowReadMore
    ? truncateAtSentence(description, maxLength)
    : description;

  // Fallback för gamla events med plain text
  if (format === 'plain') {
    return (
      <div className={className}>
        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {displayDescription}
        </p>
        {shouldShowReadMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 inline-flex items-center gap-0.5 text-[15px] font-semibold text-sea hover:text-sea-dark transition-colors"
          >
            {isExpanded ? 'Visa mindre' : 'Visa mer'}
            <span aria-hidden="true">{isExpanded ? ' ‹' : ' ›'}</span>
          </button>
        )}
      </div>
    );
  }

  const components: Partial<Components> = {
    // Paragrafer
    p: ({ node, ...props }) => (
      <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
    ),
    
    // Rubriker (h1 renderas som h2 – sidan ska bara ha en h1: eventtiteln)
    h1: ({ node, ...props }) => (
      <h2 className="text-2xl font-bold mb-4 mt-6" style={{ color: '#10214B' }} {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-semibold mb-3 mt-5" style={{ color: '#10214B' }} {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4" {...props} />
    ),
    
    // Listor
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="ml-4" {...props} />
    ),
    
    // Fetstil och kursiv
    strong: ({ node, ...props }) => (
      <strong className="font-semibold" style={{ color: '#10214B' }} {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-gray-600" {...props} />
    ),
    
    // Länkar
    a: ({ node, ...props }) => (
      <a 
        className="font-medium hover:underline" 
        style={{ color: '#0F5AA6' }}
        target="_blank" 
        rel="noopener noreferrer"
        {...props} 
      />
    ),
    
    // Blockquotes
    blockquote: ({ node, ...props }) => (
      <blockquote 
        className="italic text-gray-600 my-4 pl-4"
        style={{ borderLeft: '4px solid #0F5AA6' }}
        {...props} 
      />
    ),
    
    // Kodblock
    code: ({ node, inline, ...props }: any) => 
      inline ? (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props} />
      ) : (
        <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4" {...props} />
      ),
  };

  return (
    <div className={className}>
      <div className={`event-description ${!isExpanded && shouldShowReadMore ? 'relative' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {displayDescription}
        </ReactMarkdown>
        
        {/* Fade-out gradient när text är kollapsad */}
        {!isExpanded && shouldShowReadMore && (
          <div
            className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))'
            }}
          />
        )}
      </div>

      {/* Visa mer/mindre knapp */}
      {shouldShowReadMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 inline-flex items-center gap-0.5 text-[15px] font-semibold text-sea hover:text-sea-dark transition-colors"
        >
          {isExpanded ? 'Visa mindre' : 'Visa mer'}
          <span aria-hidden="true">{isExpanded ? ' ‹' : ' ›'}</span>
        </button>
      )}
    </div>
  );
}

