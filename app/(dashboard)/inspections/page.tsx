import { PageHeader } from '@/components/ui/page-header';
import { SubmitButton } from '@/components/ui/form';
import { summarizeInspection } from './actions';

export default function InspectionsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Inspection Summary" description="Upload a home-inspection PDF, get a plain-English summary." />

      <form action={summarizeInspection} encType="multipart/form-data" className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Property address</label>
          <input name="address" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Inspection PDF</label>
          <input name="pdf" type="file" accept="application/pdf" required className="w-full text-sm" />
        </div>
        <SubmitButton>Summarize</SubmitButton>
      </form>
    </div>
  );
}
