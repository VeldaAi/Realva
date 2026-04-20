import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { fillContract } from './actions';

export default function ContractsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="FAR/BAR AS-IS Contract Summary"
        description="Enter deal terms, get a branded summary PDF. Attach to the signed FAR/BAR form as a cover sheet."
      />

      <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Drop-in PDF form-filling for the blank FAR/BAR AS-IS is installed separately — place the
        blank PDF at <code className="rounded bg-amber-100 px-1">templates/contracts/far-bar-as-is.pdf</code> and
        the system will overlay these fields onto the official form. See README.
      </div>

      <form action={fillContract} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Property</legend>
          <Field label="Address" name="address" required />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Parties</legend>
          <Field label="Seller" name="seller" required />
          <Field label="Buyer" name="buyer" required />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Price & financing</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase price" name="purchasePrice" type="number" required />
            <Field label="Initial deposit" name="initialDeposit" type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Additional deposit" name="additionalDeposit" type="number" />
            <Field label="Loan amount" name="loanAmount" type="number" />
          </div>
          <Field label="Financing type" name="financingType" placeholder="Conventional / FHA / VA / Cash" />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Deadlines</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Closing date" name="closingDate" type="date" required />
            <Field label="Financing deadline" name="financingDeadline" type="date" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inspection period (days)" name="inspectionPeriodDays" type="number" defaultValue={15} />
            <Field label="Title review period (days)" name="titlePeriodDays" type="number" defaultValue={5} />
          </div>
        </fieldset>

        <SubmitButton>Generate summary + create deadlines</SubmitButton>
      </form>
    </div>
  );
}
