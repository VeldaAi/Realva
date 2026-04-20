import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { generateSocial } from './actions';

export default function SocialPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Social Posts" description="IG / FB / LinkedIn copy in one click." />
      <form action={generateSocial} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Address" name="address" required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" required />
          <Field label="Baths" name="baths" type="number" required />
          <Field label="Sq Ft" name="sqft" type="number" required />
        </div>
        <Field label="Price" name="price" type="number" required />
        <Field label="Key features / angle" name="features" textarea placeholder="Waterfront, pool, dock, hurricane-rated, walk to beach..." />
        <SubmitButton>Generate posts</SubmitButton>
      </form>
    </div>
  );
}
