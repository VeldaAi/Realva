import { PageHeader } from '@/components/ui/page-header';
import { Field, Select, SubmitButton } from '@/components/ui/form';
import { writeListing } from './actions';

export default function ListingsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Listing Description Writer"
        description="Short / medium / long MLS descriptions in ~15 seconds."
      />

      <form action={writeListing} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Address" name="address" required placeholder="123 Ocean Dr, Miami Beach FL" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" required />
          <Field label="Baths" name="baths" type="number" required />
          <Field label="Sq Ft" name="sqft" type="number" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year built" name="year" type="number" />
          <Field label="List price" name="price" type="number" />
        </div>
        <Field label="Key features" name="features" textarea placeholder="Updated kitchen 2024, new tile roof, impact windows, hurricane shutters, oversized lot, pool, dock..." />
        <Select
          label="Tone"
          name="tone"
          defaultValue="confident"
          options={[
            { value: 'confident', label: 'Confident — facts + authority' },
            { value: 'warm', label: 'Warm — family-friendly' },
            { value: 'luxury', label: 'Luxury — aspirational, polished' },
          ]}
        />
        <SubmitButton>Generate 3 variants</SubmitButton>
      </form>
    </div>
  );
}
