'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Gender } from '@prisma/client';
import { isOwnPublicPhotoUrl, isPrivateRef } from '@/lib/storage';

export async function submitRegistration(formData: FormData) {
  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const firstNameEn = formData.get('firstNameEn') as string;
    const lastNameEn = formData.get('lastNameEn') as string;
    const birthDateStr = formData.get('birthDate') as string;
    const gender = formData.get('gender') as Gender;
    const personalNumber = formData.get('personalNumber') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const clubId = formData.get('clubId') as string | null;
    
    const profilePictureUrl = formData.get('profilePictureUrl') as string;
    const idDocumentUrl = formData.get('idDocumentUrl') as string;
    const signedAgreementUrl = formData.get('signedAgreementUrl') as string;
    const parentIdDocumentUrl = formData.get('parentIdDocumentUrl') as string | null;

    const birthDate = new Date(birthDateStr);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const isUnder18 = age < 18;

    if (!firstName || !lastName || !birthDate || !gender || !personalNumber || !email) {
      return { success: false, error: 'აუცილებელი ველები ცარიელია' };
    }

    if (!profilePictureUrl || !idDocumentUrl || !signedAgreementUrl) {
      return { success: false, error: 'აუცილებელია ფოტოს, პირადობის და ხელმოწერილი დოკუმენტის ატვირთვა' };
    }
    
    // These values come from the browser: only accept what /api/upload issues.
    // (Otherwise a "javascript:" or third-party URL would end up as a link
    // in the staff portal.)
    if (
      !isOwnPublicPhotoUrl(profilePictureUrl) ||
      !isPrivateRef(idDocumentUrl) ||
      !isPrivateRef(signedAgreementUrl) ||
      (parentIdDocumentUrl && !isPrivateRef(parentIdDocumentUrl))
    ) {
      return { success: false, error: 'ფაილების ატვირთვა ვერ დადასტურდა, სცადეთ თავიდან' };
    }

    if (isUnder18 && !parentIdDocumentUrl) {
      return { success: false, error: 'არასრულწლოვანთათვის აუცილებელია მშობლის პირადობის მოწმობის ატვირთვა' };
    }

    const reg = await db.athleteRegistration.create({
      data: {
        firstName,
        lastName,
        firstNameEn,
        lastNameEn,
        birthDate,
        gender,
        personalNumber,
        email,
        phone,
        clubId: clubId || null,
        profilePictureUrl,
        idDocumentUrl,
        signedAgreementUrl,
        parentIdDocumentUrl: parentIdDocumentUrl || null,
        isParentConsentRequired: isUnder18,
        agreedToTermsAt: new Date(),
        status: 'PENDING'
      }
    });

    return { success: true, id: reg.id };
  } catch (error) {
    console.error('Registration failed:', error);
    return { success: false, error: 'რეგისტრაციის დროს დაფიქსირდა შეცდომა' };
  }
}
