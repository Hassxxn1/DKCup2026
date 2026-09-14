const companies: Record<string, string> = {
  'pharmafc': 'ADK Pharmaceuticals',
  'twcworriors': 'TWC',
  'twcwarriors': 'TWC',
  'twcstrikers': 'TWC',
  'teamcrd': 'ADK Hospital',
  'radhun': 'Oaga Art Resort',
  'oaga': 'Oaga Art Resort',
  'bondhuteam': 'ADK Hospital',
  'fisaari': 'ADK Company',
  'kanmathisportsclub': 'ADK Hospital',
  'ataxia': 'ADK Hospital',
  'gtlions': 'ADK Company',
  'gtunited': 'ADK Company',
};
export function teamCompany(name = ''): string {
  return companies[name.toLowerCase().replace(/[^a-z0-9]/g, '')] || '';
}
