"use client";

import { useState } from "react";
import { submitRegistration } from "../actions";

import { CATEGORY_LABELS } from "@/lib/labels";

type Club = { id: string; name: string };

export default function ApplyWizard({ clubs }: { clubs: Club[] }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    firstNameEn: "",
    lastNameEn: "",
    birthDate: "",
    gender: "MALE",
    personalNumber: "",
    email: "",
    phone: "",
    clubId: "",
    profilePictureUrl: "",
    idDocumentUrl: "",
    digitalSignature: "",
    parentName: "",
    parentSignature: "",
    signedAgreementUrl: "",
    agreedToRules: false,
    agreedToAntiDoping: false,
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  const transliterateToGeorgian = (text: string) => {
    const geoMap: Record<string, string> = {
      a: "ა", b: "ბ", c: "ც", d: "დ", e: "ე", f: "ფ", g: "გ", h: "ჰ", i: "ი", j: "ჯ",
      k: "კ", l: "ლ", m: "მ", n: "ნ", o: "ო", p: "პ", q: "ქ", r: "რ", s: "ს", t: "ტ",
      u: "უ", v: "ვ", w: "წ", x: "ხ", y: "ყ", z: "ზ",
      A: "ა", B: "ბ", C: "ჩ", D: "დ", E: "ე", F: "ფ", G: "გ", H: "ჰ", I: "ი", J: "ჟ",
      K: "კ", L: "ლ", M: "მ", N: "ნ", O: "ო", P: "პ", Q: "ქ", R: "ღ", S: "შ", T: "თ",
      U: "უ", V: "ვ", W: "ჭ", X: "ხ", Y: "ყ", Z: "ძ"
    };
    return text.split('').map(char => geoMap[char] || char).join('');
  };

  const isUnder18 = () => {
    if (!formData.birthDate) return false;
    const birthYear = new Date(formData.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear < 18;
  };

  const getAgeCategory = () => {
    if (!formData.birthDate) return null;
    const birthYear = new Date(formData.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    if (age <= 9) return "JUVENILE_I";
    if (age >= 10 && age <= 11) return "JUVENILE_II";
    if (age >= 12 && age <= 13) return "JUNIOR_I";
    if (age >= 14 && age <= 15) return "JUNIOR_II";
    if (age >= 16 && age <= 18) return "YOUTH";
    return "ADULT";
  };

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const uploadFile = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    if (!res.ok) throw new Error("Upload failed");
    const json = await res.json();
    return json.url;
  };

  const handleSubmit = async () => {
    if (!formData.agreedToRules || !formData.agreedToAntiDoping || !agreementFile) {
      setErrorMsg("გთხოვთ დაეთანხმოთ წესებს და ატვირთოთ ხელმოწერილი დოკუმენტი.");
      return;
    }
    if (isUnder18() && !formData.parentName) {
      setErrorMsg("არასრულწლოვანთათვის აუცილებელია მშობლის სახელის მითითება.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let profileUrl = formData.profilePictureUrl;
      let idUrl = formData.idDocumentUrl;

      let agreementUrl = formData.signedAgreementUrl;

      // Upload if files selected
      if (profileFile) profileUrl = await uploadFile(profileFile);
      if (idFile) idUrl = await uploadFile(idFile);
      if (agreementFile) agreementUrl = await uploadFile(agreementFile);

      if (!profileUrl || !idUrl || !agreementUrl) {
        setErrorMsg("ფოტოს, პირადობის და ხელმოწერილი დოკუმენტის ატვირთვა აუცილებელია.");
        setIsSubmitting(false);
        return;
      }

      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, String(v)));
      fd.set("profilePictureUrl", profileUrl);
      fd.set("idDocumentUrl", idUrl);
      fd.set("signedAgreementUrl", agreementUrl);

      const res = await submitRegistration(fd);
      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res.error || "რეგისტრაცია ვერ მოხერხდა.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "შეცდომა ატვირთვისას.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-10 rounded shadow text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">განაცხადი მიღებულია!</h2>
        <p className="text-gray-600 mb-6">თქვენი რეგისტრაცია წარმატებით გაიგზავნა დასადასტურებლად. GNDSF-ის ადმინისტრაცია მალე დაგიკავშირდებათ.</p>
        <button onClick={() => window.location.href = "/"} className="bg-[#8B1E0F] text-white px-6 py-2 rounded font-bold hover:bg-[#B83A14]">
          მთავარ გვერდზე დაბრუნება
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded shadow">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex flex-col items-center flex-1 ${step === i ? "text-[#8B1E0F]" : step > i ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step === i ? "border-[#8B1E0F] bg-[#8B1E0F] text-white" : step > i ? "border-green-600 bg-green-600 text-white" : "border-gray-300"}`}>
              {step > i ? "✓" : i}
            </div>
            <span className="text-[11px] uppercase mt-2 font-bold tracking-wider hidden sm:block">
              {i === 1 ? "პირადი" : i === 2 ? "თანხმობა" : i === 3 ? "დოკუმენტები" : "დასრულება"}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded mb-6 text-sm">{errorMsg}</div>}

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">პირადი ინფორმაცია</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">სახელი (ქართულად)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: transliterateToGeorgian(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">გვარი (ქართულად)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: transliterateToGeorgian(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name (English)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={formData.firstNameEn} onChange={(e) => setFormData({ ...formData, firstNameEn: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Surname (English)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={formData.lastNameEn} onChange={(e) => setFormData({ ...formData, lastNameEn: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">დაბადების თარიღი</label>
              <input type="date" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#8B1E0F] outline-none" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
              {formData.birthDate && (
                <div className="mt-2 text-[12px] text-green-700 bg-green-50 px-2 py-1 rounded inline-block font-bold">
                  ასაკობრივი ჯგუფი: {CATEGORY_LABELS[getAgeCategory() as keyof typeof CATEGORY_LABELS]}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">სქესი</label>
              <select className="w-full border rounded px-3 py-2" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="MALE">კაცი</option>
                <option value="FEMALE">ქალი</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">პირადი ნომერი (პირადობის მოწმობა)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={formData.personalNumber} onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">კლუბი (არა სავალდებულო)</label>
              <select className="w-full border rounded px-3 py-2" value={formData.clubId} onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}>
                <option value="">- აირჩიეთ კლუბი -</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ელ-ფოსტა</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ტელეფონი</label>
              <input type="tel" className="w-full border rounded px-3 py-2" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Consents */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">წესები და ციფრული ხელმოწერა</h2>
          
          <div className="bg-gray-50 border rounded p-4">
            <h3 className="font-bold mb-2">GNDSF & WDSF ოფიციალური წესდება</h3>
            <div className="bg-white border rounded p-4 h-48 overflow-y-auto text-sm text-gray-700 shadow-inner mb-4 space-y-3">
              <p><strong>1. ზოგადი დებულებები</strong></p>
              <p>სპორტსმენი ვალდებულია დაიცვას საქართველოს სპორტული ცეკვების ეროვნული ფედერაციის (GNDSF) და მსოფლიო ფედერაციის (WDSF) მიერ დადგენილი ყველა წესი და რეგულაცია.</p>
              <p><strong>2. ეთიკის კოდექსი</strong></p>
              <p>სპორტსმენი, მისი მშობლები და მწვრთნელები ვალდებულნი არიან გამოიჩინონ პატივისცემა სხვა კონკურენტების, მსაჯებისა და ორგანიზატორების მიმართ. ნებისმიერი არაეთიკური ქმედება გამოიწვევს დისკვალიფიკაციას.</p>
              <p><strong>3. ანტი-დოპინგის კოდექსი</strong></p>
              <p>სპორტსმენი თანახმაა, მოთხოვნის შემთხვევაში, ჩააბაროს სისხლის ან შარდის ნიმუში ანტი-დოპინგური შემოწმების მიზნით, WADA-ს წესების სრული დაცვით.</p>
              <p><strong>4. პერსონალური მონაცემები და მედია</strong></p>
              <p>მე ვაცხადებ თანხმობას, რომ ფედერაციამ გამოიყენოს ჩემი ფოტო და ვიდეო მასალა (გადაღებული ტურნირებზე) ფედერაციის პოპულარიზაციისა და სატელევიზიო ტრანსლაციის მიზნებისთვის ყოველგვარი დამატებითი კომპენსაციის გარეშე.</p>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer bg-white p-3 border rounded hover:bg-gray-50 transition-colors shadow-sm">
              <input type="checkbox" checked={formData.agreedToRules} onChange={(e) => setFormData({...formData, agreedToRules: e.target.checked})} className="w-5 h-5 text-[#8B1E0F] rounded focus:ring-[#8B1E0F]" />
              <span className="font-medium">წავიკითხე და ვეთანხმები GNDSF-ის წესდებას და პირობებს</span>
            </label>
          </div>

          <div className="bg-gray-50 border rounded p-4">
            <label className="flex items-center gap-3 cursor-pointer bg-white p-3 border rounded hover:bg-gray-50 transition-colors shadow-sm">
              <input type="checkbox" checked={formData.agreedToAntiDoping} onChange={(e) => setFormData({...formData, agreedToAntiDoping: e.target.checked})} className="w-5 h-5 text-[#8B1E0F] rounded focus:ring-[#8B1E0F]" />
              <span className="font-medium">ვეთანხმები ანტი-დოპინგის კოდექსს და მოთხოვნებს</span>
            </label>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">წესდების თანხმობა და ხელმოწერა</h3>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-sm text-blue-800 mb-3">
                1. გთხოვთ ჩამოტვირთოთ თანხმობის ფორმა.<br/>
                2. ამობეჭდეთ და მოაწერეთ ხელი (არასრულწლოვანის შემთხვევაში მშობელმა).<br/>
                3. დაასკანერეთ ან გადაუღეთ სურათი და ატვირთეთ ქვემოთ.
              </p>
              <a href="/dummy-agreement-form.pdf" download className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors">
                ⬇️ ფორმის ჩამოტვირთვა (PDF)
              </a>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">ატვირთეთ ხელმოწერილი დოკუმენტი</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setAgreementFile(e.target.files?.[0] || null)} className="w-full border rounded p-2 bg-gray-50" />
              {agreementFile && <p className="text-sm text-green-600 mt-2 font-bold">არჩეულია: {agreementFile.name}</p>}
            </div>

            {isUnder18() && (
              <div className="bg-yellow-50 p-4 border border-yellow-200 rounded mt-4">
                <h4 className="font-bold text-yellow-800 mb-2">მშობლის / მეურვის თანხმობა</h4>
                <p className="text-sm text-yellow-700 mb-4">რადგან სპორტსმენი არასრულწლოვანია, ფორმაზე ხელი უნდა მოაწეროს მშობელმა.</p>
                <div>
                  <label className="block text-sm font-medium mb-1">მშობლის სახელი და გვარი</label>
                  <input type="text" className="w-full border border-yellow-300 rounded px-3 py-2" value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">დოკუმენტების ატვირთვა</h2>
          
          <div className="border-2 border-dashed rounded p-6 text-center hover:bg-gray-50">
            <h3 className="font-bold mb-2">პროფილის სურათი</h3>
            <p className="text-sm text-gray-500 mb-4">ატვირთეთ სახის ნათელი სურათი თეთრ ფონზე (პასპორტის სტილის). იხილეთ მაგალითი ქვემოთ.</p>
            
            <img src="/photo-examples.png" alt="Photo upload examples" className="w-full max-w-lg mx-auto rounded shadow-sm mb-6 border" />
            
            <input type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files?.[0] || null)} className="mx-auto block" />
            {profileFile && <p className="text-sm text-green-600 mt-2 font-bold">არჩეულია: {profileFile.name}</p>}
          </div>

          <div className="border-2 border-dashed rounded p-6 text-center hover:bg-gray-50">
            <h3 className="font-bold mb-2">პირადობის დამადასტურებელი დოკუმენტი</h3>
            <p className="text-sm text-gray-500 mb-4">ატვირთეთ პირადობის მოწმობის ან პასპორტის მკაფიო ასლი/ფოტო.</p>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="mx-auto block" />
            {idFile && <p className="text-sm text-green-600 mt-2 font-bold">არჩეულია: {idFile.name}</p>}
          </div>
        </div>
      )}

      {/* Step 4: Submission */}
      {step === 4 && (
        <div className="space-y-6 text-center">
          <h2 className="text-xl font-bold border-b pb-2 text-left">მონაცემების გადახედვა და გაგზავნა</h2>
          
          <div className="bg-gray-50 p-6 rounded text-left space-y-2">
            <p><strong>სპორტსმენი:</strong> {formData.firstName} {formData.lastName}</p>
            <p><strong>პირადი ნომერი:</strong> {formData.personalNumber}</p>
            <p><strong>სტატუსი:</strong> {isUnder18() ? "არასრულწლოვანი (აუცილებელია მშობლის დასტური)" : "სრულწლოვანი"}</p>
            <p><strong>დოკუმენტები:</strong> {profileFile && idFile && agreementFile ? "არჩეულია ✅" : "აკლია ❌"}</p>
          </div>

          <p className="text-gray-600 text-sm py-4">
            დარწმუნდით, რომ შეყვანილი მონაცემები ზუსტია. გაგზავნის შემდეგ e-Card-ის საფასურის გადახდის შესახებ ინსტრუქციას მიიღებთ ელ-ფოსტაზე, ან დაუკავშირდით თქვენს კლუბს.
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-4 border-t">
        {step > 1 ? (
          <button onClick={handlePrev} className="px-6 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300">
            უკან
          </button>
        ) : <div></div>}

        {step < 4 ? (
          <button 
            onClick={handleNext} 
            className="px-6 py-2 bg-[#8B1E0F] text-white rounded font-bold hover:bg-[#B83A14]"
          >
            შემდეგი
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className={`px-8 py-2 text-white rounded font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isSubmitting ? "იგზავნება..." : "გაგზავნა"}
          </button>
        )}
      </div>
    </div>
  );
}
