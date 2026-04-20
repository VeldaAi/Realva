import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { generateFlyer } from './actions';

export default function FlyersPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Property Flyer" description="One-page branded PDF flyer." />
      <form action={generateFlyer} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Address" name="address" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" name="city" required />
          <Field label="State" name="state" defaultValue="FL" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" required />
          <Field label="Baths" name="baths" type="number" required />
          <Field label="Sq Ft" name="sqft" type="number" required />
        </div>
        <Field label="Price" name="price" type="number" required />
        <Field label="Key features" name="features" textarea placeholder="Granite counters, impact windows, new AC, etc." />
        <SubmitButton>Generate flyer PDF</SubmitButton>
      </form>
    </div>
  );
}
