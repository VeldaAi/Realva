import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { generateNeighborhood } from './actions';

export default function NeighborhoodsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Neighborhood Report" description="Census data + schools + narrative → branded PDF." />

      <form action={generateNeighborhood} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Neighborhood / city" name="neighborhood" required placeholder="Coral Gables" />
        <Field label="Zip (optional for finer data)" name="zip" placeholder="33134" />
        <SubmitButton>Generate report</SubmitButton>
      </form>
    </div>
  );
}
