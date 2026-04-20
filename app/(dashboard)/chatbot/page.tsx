import { PageHeader } from '@/components/ui/page-header';
import { ChatUI } from './ChatUI';

export default function ChatbotPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Buyer FAQ Bot" description="Florida-real-estate-aware assistant. Share the public page with buyers." />
      <ChatUI />
    </div>
  );
}
