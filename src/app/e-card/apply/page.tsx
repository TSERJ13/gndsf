import { db } from '@/lib/db';
import ApplyWizard from './ApplyWizard';

export default async function ECardApplyPage() {
  let clubs: any[] = [];
  try {
    clubs = await db.club.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
  } catch (err) {
    console.error("ECardApplyPage DB error:", err);
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900 mb-2">GNDSF e-Card</h1>
          <p className="text-gray-600">სპორტსმენის ონლაინ რეგისტრაცია</p>
        </div>
        
        <ApplyWizard clubs={clubs} />
      </div>
    </div>
  );
}
