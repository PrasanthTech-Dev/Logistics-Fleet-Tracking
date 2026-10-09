import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';

export default function NotFoundPage() {
  return <EmptyState title="That page doesn't exist" description="The link may be out of date. Head back to the dashboard." action={<Link to="/"><Button>Go to dashboard</Button></Link>} />;
}
