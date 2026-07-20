import { db } from '@/lib/db';
import Link from 'next/link';

export default async function ECardsAdminPage() {
  const registrations = await db.athleteRegistration.findMany({
    orderBy: { createdAt: 'desc' },
    include: { club: true }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">e-Card განაცხადები</h1>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">სპორტსმენი</th>
              <th className="px-4 py-3 font-semibold text-gray-600">პირადი №</th>
              <th className="px-4 py-3 font-semibold text-gray-600">ასაკი (მშობელი)</th>
              <th className="px-4 py-3 font-semibold text-gray-600">კლუბი</th>
              <th className="px-4 py-3 font-semibold text-gray-600">სტატუსი</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  განაცხადები არ მოიძებნა
                </td>
              </tr>
            ) : registrations.map(reg => {
              const isUnder18 = reg.isParentConsentRequired;
              
              return (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {reg.firstName} {reg.lastName}
                    <div className="text-xs text-gray-500">{reg.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reg.personalNumber}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {isUnder18 ? (
                      <span className="text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs">არასრულწლოვანი</span>
                    ) : (
                      <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs">სრულწლოვანი</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reg.club?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      reg.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      reg.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm text-blue-600 hover:underline">ნახვა / დადასტურება</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
