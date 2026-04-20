import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { generateCMA } from './actions';

export default function CMAPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="CMA Generator" description="Full Comparative Market Analysis PDF. Pulls comps via RentCast + Ollama narrative." />

      <form action={generateCMA} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Subject address" name="address" required placeholder="123 Ocean Dr, Miami Beach FL 33139" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" name="city" required />
          <Field label="Zip" name="zip" required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" required />
          <Field label="Baths" name="baths" type="number" required />
          <Field label="Sq Ft" name="sqft" type="number" required />
        </div>
        <Field label="Search radius (mi)" name="radius" type="number" defaultValue={1} />
        <SubmitButton>Generate CMA</SubmitButton>
      </form>
    </div>
  );
}
