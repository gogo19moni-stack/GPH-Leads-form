import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { Express, Request, Response } from "express";
import * as XLSX from "xlsx";

type LeadPayload = Record<string, unknown>;
type FirestoreLead = LeadPayload & { id: string; createdAt: string };

const labels: Record<string, string> = {
  fullName: "الاسم واللقب", company: "الشركة أو المؤسسة", jobTitle: "الوظيفة", phone: "رقم الهاتف",
  email: "البريد الإلكتروني", wilaya: "الولاية", businessType: "طبيعة النشاط", otherBusiness: "نشاط آخر",
  products: "المنتجات محل الاهتمام", otherProduct: "منتجات أخرى", discovery: "مصدر المعرفة بـ GPH",
  workedWithGph: "تعامل سابق مع GPH", needs: "الاحتياجات والمتطلبات", contactGoals: "هدف التواصل",
  otherGoal: "هدف آخر", orderSize: "حجم الطلب", purchaseTiming: "موعد الشراء", preferredContact: "وسيلة التواصل",
  notes: "ملاحظات ممثل GPH", followUpDate: "تاريخ المتابعة", interest: "درجة الاهتمام",
};

function firestore() {
  let clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim().replace(/^["']|["']$/g, "").replace(/[\r\n,]+$/g, "");
  let privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").trim();
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail,
          privateKey,
        }),
      });
  return getFirestore(app);
}

function toLead(id: string, data: Record<string, unknown>): FirestoreLead {
  const createdAt = typeof data.createdAtIso === "string" ? data.createdAtIso : new Date().toISOString();
  const { createdAtIso: _createdAtIso, createdAt: _createdAt, ...payload } = data;
  return { id, ...payload, createdAt };
}

function flattenLead(lead: FirestoreLead) {
  const row: Record<string, string | number> = { "رقم السجل": lead.id, "تاريخ التسجيل": lead.createdAt };
  for (const [key, label] of Object.entries(labels)) {
    const value = lead[key];
    row[label] = Array.isArray(value) ? value.join("، ") : String(value ?? "");
  }
  return row;
}

async function getLeads() {
  const snapshot = await firestore().collection("leads").get();
  return snapshot.docs
    .map((doc) => toLead(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function isAdmin(req: Request) {
  const expected = process.env.FIREBASE_ADMIN_EXPORT_TOKEN;
  const authorization = req.header("authorization") || "";
  return Boolean(expected && authorization === `Bearer ${expected}`);
}

export function registerFirestoreLeadRoutes(app: Express) {
  app.post("/api/firebase/leads", async (req: Request, res: Response) => {
    try {
      const payload = req.body as LeadPayload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        res.status(400).json({ ok: false, message: "بيانات الاستمارة غير صالحة" });
        return;
      }
      const createdAt = new Date().toISOString();
      const reference = await firestore().collection("leads").add({ ...payload, createdAtIso: createdAt, createdAt: FieldValue.serverTimestamp() });
      res.status(201).json({ ok: true, id: reference.id, createdAt });
    } catch (error) {
      console.error("[firebase] lead write failed", error);
      res.status(503).json({ ok: false, message: "تعذر حفظ الاستمارة في Firebase" });
    }
  });

  app.get("/api/firebase/leads", async (req: Request, res: Response) => {
    if (!isAdmin(req)) { res.status(401).json({ ok: false, message: "غير مصرح" }); return; }
    try {
      const leads = await getLeads();
      res.json({ ok: true, count: leads.length, leads });
    } catch (error) {
      console.error("[firebase] lead list failed", error);
      res.status(503).json({ ok: false, message: "تعذر قراءة بيانات Firebase" });
    }
  });

  app.get("/api/firebase/leads.xlsx", async (req: Request, res: Response) => {
    if (!isAdmin(req)) { res.status(401).json({ ok: false, message: "غير مصرح" }); return; }
    try {
      const leads = await getLeads();
      const worksheet = XLSX.utils.json_to_sheet(leads.length ? leads.map(flattenLead) : [{ "رسالة": "لا توجد سجلات بعد" }]);
      worksheet["!cols"] = Object.keys(leads[0] ? flattenLead(leads[0]) : { "رسالة": "" }).map(() => ({ wch: 24 }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "بيانات العملاء");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''gph-firebase-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("[firebase] export failed", error);
      res.status(503).json({ ok: false, message: "تعذر إنشاء ملف Excel" });
    }
  });

  app.get("/api/firebase/health", async (req: Request, res: Response) => {
    if (!isAdmin(req)) { res.status(401).json({ ok: false, message: "غير مصرح" }); return; }
    try {
      const leads = await getLeads();
      res.json({ ok: true, projectId: process.env.FIREBASE_PROJECT_ID, count: leads.length });
    } catch (error) {
      console.error("[firebase] health check failed", error);
      res.status(503).json({ ok: false, message: "تعذر الاتصال بـ Firestore" });
    }
  });
}
