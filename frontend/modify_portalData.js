const fs = require('fs');
let content = fs.readFileSync('src/utils/data/portalData.js', 'utf8');

// Add Risk Tier Guide to Organization
content = content.replace(
  "{ id: 'resources', label: 'Legal Resources'",
  "{ id: 'tiers', label: 'Risk Tier Guide', desc: 'Understanding offender classifications', icon: BookOpen, path: '/portal/tiers' },\n    { id: 'resources', label: 'Legal Resources'"
);

// Add Risk Tier Guide to Police and remove Add Offender
content = content.replace(
  "    { id: 'new', label: 'Add Offender Record', desc: 'Add convicted offenders', icon: Plus, path: '/portal/new', upcoming: true },",
  "    { id: 'tiers', label: 'Risk Tier Guide', desc: 'Understanding offender classifications', icon: BookOpen, path: '/portal/tiers' },"
);

fs.writeFileSync('src/utils/data/portalData.js', content);
console.log('Done');
