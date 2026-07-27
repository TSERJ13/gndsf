import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import ECardList from './ECardList';

export default async function ECardsAdminPage() {
  await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);

  const registrations = await db.athleteRegistration.findMany({
    orderBy: { createdAt: 'desc' },
    include: { club: true }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">e-Card განაცხადები</h1>
      </div>

      <ECardList registrations={registrations} />
    </div>
  );
}
