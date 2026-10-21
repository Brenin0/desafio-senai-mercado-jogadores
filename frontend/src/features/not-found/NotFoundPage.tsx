import { Link } from 'react-router';
import { PageHeader } from '../../components/PageHeader.tsx';

export function NotFoundPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Página não encontrada" />
      <p className="text-slate-600">O endereço aberto não existe no Passe.</p>
      <Link to="/" className="font-medium text-blue-700 hover:underline">
        Voltar para a lista de jogadores
      </Link>
    </div>
  );
}
