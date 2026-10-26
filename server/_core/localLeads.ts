import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Express, Request, Response } from "express";
import * as XLSX from "xlsx";

export type LocalLeadPayload = Record<string, unknown>;

const dbPath = path.resolve(process.env.LOCAL_DB_PATH || path.join(process.cwd(), "data", "gph-leads.sqlite"));
let database: DatabaseSync | undefined;

function getDatabase() {
  if (!database) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    database = new DatabaseSync(dbPath);
    database.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }
  return database;
}

function flattenPayload(payload: LocalLeadPayload) {
  const labels: Record<string, string> = {
    fullName: "الاسم واللقب", company: "الشركة أو المؤسسة", jobTitle: "الوظيفة", phone: "رقم الهاتف",
    email: "البريد الإلكتروني", wilaya: "الولاية", businessType: "طبيعة النشاط", otherBusiness: "نشاط آخر",
    products: "المنتجات محل الاهتمام", otherProduct: "منتجات أخرى", discovery: "مصدر المعرفة بـ GPH",
    workedWithGph: "تعامل سابق مع GPH", needs: "الاحتياجات والمتطلبات", contactGoals: "هدف التواصل",
    otherGoal: "هدف آخر", orderSize: "حجم الطلب", purchaseTiming: "موعد الشراء", preferredContact: "وسيلة التواصل",
    notes: "ملاحظات ممثل GPH", followUpDate: "تاريخ المتابعة", interest: "درجة الاهتمام",
  };
  const row: Record<string, string | number> = {};
  for (const [key, label] of Object.entries(labels)) {
    const value = payload[key];
    row[label] = Array.isArray(value) ? value.join("، ") : String(value ?? "");
  }
  return row;
}

export function registerLocalLeadRoutes(app: Express) {
  app.post("/api/local/leads", (req: Request, res: Response) => {
    const payload = req.body as LocalLeadPayload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      res.status(400).json({ ok: false, message: "بيانات الاستمارة غير صالحة" });
      return;
    }
    const createdAt = new Date().toISOString();
    const result = getDatabase().prepare("INSERT INTO leads (payload, created_at) VALUES (?, ?)").run(JSON.stringify(payload), createdAt);
    res.status(201).json({ ok: true, id: Number(result.lastInsertRowid), createdAt });
  });

  app.get("/api/local/leads", (_req: Request, res: Response) => {
    const rows = getDatabase().prepare("SELECT id, payload, created_at AS createdAt FROM leads ORDER BY id DESC").all() as Array<{ id: number; payload: string; createdAt: string }>;
    res.json({ ok: true, count: rows.length, leads: rows.map((row) => ({ id: row.id, ...JSON.parse(row.payload), createdAt: row.createdAt })) });
  });

  app.get("/api/local/leads.xlsx", (_req: Request, res: Response) => {
    const rows = getDatabase().prepare("SELECT id, payload, created_at AS createdAt FROM leads ORDER BY id ASC").all() as Array<{ id: number; payload: string; createdAt: string }>;
    const data = rows.map((row) => ({ "رقم السجل": row.id, "تاريخ التسجيل": row.createdAt, ...flattenPayload(JSON.parse(row.payload) as LocalLeadPayload) }));
    const worksheet = XLSX.utils.json_to_sheet(data.length ? data : [{ "رسالة": "لا توجد سجلات بعد" }]);
    worksheet["!cols"] = Object.keys(data[0] ?? { "رسالة": "" }).map(() => ({ wch: 24 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "بيانات العملاء");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''gph-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  });

  app.get("/api/local/health", (_req: Request, res: Response) => {
    const row = getDatabase().prepare("SELECT COUNT(*) AS count FROM leads").get() as { count: number };
    res.json({ ok: true, database: dbPath, count: Number(row.count) });
  });
}
