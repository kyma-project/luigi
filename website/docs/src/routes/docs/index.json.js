
import { getParsedDocs } from './_parser';

export function get(req, res) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });

  getParsedDocs().then((contents) => {
    res.end(contents);
  });
}