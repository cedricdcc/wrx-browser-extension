import { useEffect, useState } from 'react';
import { Parser, Quad } from 'n3';

const normalizeTargetUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [target, setTarget] = useState<string>('');
  const [triples, setTriples] = useState<Quad[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('target');

    if (targetUrl) {
      const normalizedTargetUrl = normalizeTargetUrl(targetUrl);

      if (!normalizedTargetUrl) {
        setError('Invalid target URL provided.');
        setLoading(false);
        return;
      }

      setTarget(normalizedTargetUrl);
      fetchTriples(normalizedTargetUrl);
    } else {
      setError('No target URL provided.');
      setLoading(false);
    }
  }, []);

  const fetchTriples = async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept:
            'text/turtle;q=1.0, application/n-triples;q=0.9, application/rdf+xml;q=0.8, application/ld+json;q=0.7'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      const parser = new Parser();
      const parsedTriples = parser.parse(text);

      setTriples(parsedTriples);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch or parse triples.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>WRX Triple Viewer</h1>
        <p>
          Source: {target}
        </p>
      </header>

      <main>
        {loading && <div className="status">Fetching Linked Data...</div>}

        {error && <div className="error">Error: {error}</div>}

        {!loading && !error && triples.length === 0 && (
          <div className="status">No triples found or endpoint did not return RDF.</div>
        )}

        {!loading && !error && triples.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Predicate</th>
                <th>Object</th>
              </tr>
            </thead>
            <tbody>
              {triples.map((t) => (
                <tr
                  key={JSON.stringify([
                    t.subject.value,
                    t.predicate.value,
                    t.object.termType,
                    t.object.value,
                    t.graph.value
                  ])}
                >
                  <td className="subject">{t.subject.value}</td>
                  <td className="predicate">{t.predicate.value}</td>
                  <td className="object">
                    {t.object.termType === 'Literal' ? `"${t.object.value}"` : t.object.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
