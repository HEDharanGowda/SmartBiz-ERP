import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';

export type Customer = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gstin?: string;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  companyId: string;
  items: InvoiceItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  status: 'Unpaid' | 'Partially_Paid' | 'Fully_Paid';
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  amount: number;
};

export type Payment = {
  id: string;
  invoiceId: string;
  companyId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  createdBy: string;
  createdAt: string;
};

export class SalesModel {
  private customers: Collection<Customer>;
  private invoices: Collection<Invoice>;
  private payments: Collection<Payment>;
  private counters: Collection<{ _id: string; seq: number }>;

  constructor(db: Db) {
    this.customers = db.collection<Customer>('customers');
    this.invoices = db.collection<Invoice>('invoices');
    this.payments = db.collection<Payment>('payments');
    this.counters = db.collection<{ _id: string; seq: number }>('invoice_counters');
  }

  async ensureIndexes() {
    await Promise.all([
      this.customers.createIndex({ companyId: 1 }),
      this.customers.createIndex({ email: 1 }),
      this.invoices.createIndex({ invoiceNumber: 1 }, { unique: true }),
      this.invoices.createIndex({ companyId: 1 }),
      this.invoices.createIndex({ status: 1 }),
      this.payments.createIndex({ invoiceId: 1 }),
      this.payments.createIndex({ companyId: 1 })
    ]);
  }

  async getNextInvoiceNumber(companyId: string): Promise<string> {
    const result = await this.counters.findOneAndUpdate(
      { _id: `invoice_${companyId}` },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const seq = result!.seq;
    return `INV-${companyId.slice(0, 6)}-${String(seq).padStart(6, '0')}`;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.customers.insertOne(newCustomer);
    return newCustomer;
  }

  async findCustomers(companyId: string): Promise<Customer[]> {
    return this.customers.find({ companyId }).toArray();
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const now = new Date().toISOString();
    const invoiceNumber = await this.getNextInvoiceNumber(invoice.companyId);
    const newInvoice: Invoice = {
      ...invoice,
      id: randomUUID(),
      invoiceNumber,
      createdAt: now,
      updatedAt: now
    };
    await this.invoices.insertOne(newInvoice);
    return newInvoice;
  }

  async findInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.findOne({ id });
  }

  async findInvoices(companyId: string, status?: string): Promise<Invoice[]> {
    const filter: any = { companyId };
    if (status) {
      filter.status = status;
    }
    return this.invoices.find(filter).toArray();
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const result = await this.invoices.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const newPayment: Payment = {
      ...payment,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    await this.payments.insertOne(newPayment);
    return newPayment;
  }

  async getPayments(invoiceId: string): Promise<Payment[]> {
    return this.payments.find({ invoiceId }).toArray();
  }
}
