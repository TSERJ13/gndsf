'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Gender } from '@prisma/client';

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
    
    const parentName = formData.get('parentName') as string | null;
    const parentSignature = formData.get('parentSignature') as string | null;
    const digitalSignature = formData.get('digitalSignature') as string;

    const birthDate = new Date(birthDateStr);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const isUnder18 = age < 18;

    if (!firstName || !lastName || !birthDate || !gender || !personalNumber || !email || !digitalSignature) {
      return { success: false, error: 'აუცილებელი ველები ცარიელია' };
    }

    if (isUnder18 && (!parentName || !parentSignature)) {
      return { success: false, error: 'არასრულწლოვანთათვის აუცილებელია მშობლის თანხმობა' };
    }

    if (!profilePictureUrl || !idDocumentUrl) {
      return { success: false, error: 'აუცილებელია ფოტოს და პირადობის ატვირთვა' };
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
        isParentConsentRequired: isUnder18,
        parentName: parentName || null,
        parentSignature: parentSignature || null,
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
