import { teamCompany } from '@/lib/team-company';
export default function TeamName({name}:{name:string}) {
  const company=teamCompany(name);
  return <span className="team-name-label">{name}{company && <small className="team-company">{company}</small>}</span>;
}
